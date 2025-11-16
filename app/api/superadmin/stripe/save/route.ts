import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, createAuditLog } from '@/lib/super-admin'
import { stripeConfig } from '@/lib/system-config'

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { secretKey, publishableKey, webhookSecret } = await request.json()

    if (!secretKey || !publishableKey) {
      return NextResponse.json(
        { success: false, error: 'Secret key and publishable key required' },
        { status: 400 }
      )
    }

    // Sauvegarder les clés (chiffrées)
    await stripeConfig.setSecretKey(secretKey)
    await stripeConfig.setPublishableKey(publishableKey)

    if (webhookSecret) {
      await stripeConfig.setWebhookSecret(webhookSecret)
    }

    // Audit log
    await createAuditLog({
      action: 'CONFIG_CHANGE',
      entity: 'SystemConfig',
      description: 'Configuration Stripe mise à jour',
      metadata: { category: 'STRIPE' },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
