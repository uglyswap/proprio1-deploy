/**
 * API CRON pour reset mensuel des crédits
 *
 * À appeler quotidiennement via un service CRON externe:
 * - Vercel Cron
 * - GitHub Actions
 * - Cron tab serveur
 *
 * Exemple Vercel CRON (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reset-credits",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resetAllOrganizationsCredits } from '@/lib/credits-reset'
import { updateDailyMetrics } from '@/lib/super-admin'

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (sécurité)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ FIX: Also check Vercel Cron header as fallback
    const isVercelCron = request.headers.get('x-vercel-cron') === 'true'
    if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    console.log('🔄 CRON: Début du reset mensuel des crédits...')

    // Reset des crédits
    const count = await resetAllOrganizationsCredits()

    console.log(`✅ CRON: ${count} organisations ont été reset`)

    // Mettre à jour les métriques quotidiennes
    await updateDailyMetrics()

    console.log('✅ CRON: Métriques quotidiennes mises à jour')

    return NextResponse.json({
      success: true,
      organizationsReset: count,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ CRON Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
