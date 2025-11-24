import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { findUltimateDirigeants, findUltimateDirigeantsBatch } from '@/lib/cascade-dirigeants'

/**
 * POST /api/dirigeants/cascade
 * Recherche en cascade des dirigeants personnes physiques
 * 
 * Body:
 * - siren: string (un seul SIREN)
 * - sirens: string[] (plusieurs SIREN pour batch)
 */
export async function POST(request: NextRequest) {
  try {
    // Verifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { siren, sirens } = body

    // Mode batch
    if (sirens && Array.isArray(sirens)) {
      if (sirens.length > 100) {
        return NextResponse.json(
          { error: 'Maximum 100 SIREN par requete' },
          { status: 400 }
        )
      }

      const results = await findUltimateDirigeantsBatch(sirens)
      
      // Convertir Map en objet pour JSON
      const resultObj: Record<string, any> = {}
      results.forEach((value, key) => {
        resultObj[key] = value
      })

      return NextResponse.json({
        success: true,
        count: sirens.length,
        results: resultObj
      })
    }

    // Mode simple
    if (!siren) {
      return NextResponse.json(
        { error: 'SIREN requis' },
        { status: 400 }
      )
    }

    const result = await findUltimateDirigeants(siren)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Erreur recherche cascade:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dirigeants/cascade?siren=123456789
 * Recherche simple par SIREN
 */
export async function GET(request: NextRequest) {
  try {
    // Verifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const siren = searchParams.get('siren')

    if (!siren) {
      return NextResponse.json(
        { error: 'SIREN requis (parametre ?siren=...)' },
        { status: 400 }
      )
    }

    const result = await findUltimateDirigeants(siren)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Erreur recherche cascade:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
