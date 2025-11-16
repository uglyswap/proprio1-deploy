import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserOrganization } from '@/lib/auth'
import { SearchType } from '@prisma/client'
import { countByAddress, countByOwner, countByZone } from '@/lib/data-crosser'
import { planConfig } from '@/lib/system-config'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await getUserOrganization(session.user.id)

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { type, criteria } = body as {
      type: SearchType
      criteria: any
    }

    // Count results using data-crosser (multi-source)
    let estimatedRows = 0

    try {
      if (type === 'BY_ADDRESS') {
        const { adresse, codePostal } = criteria
        estimatedRows = await countByAddress(adresse, codePostal)
      } else if (type === 'BY_OWNER') {
        const { proprietaire, siren } = criteria
        estimatedRows = await countByOwner(proprietaire, siren)
      } else if (type === 'BY_ZONE') {
        const { polygon } = criteria

        // Build bounds from polygon
        const lngs = polygon.map((p: number[]) => p[0])
        const lats = polygon.map((p: number[]) => p[1])

        const bounds = {
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          minLng: Math.min(...lngs),
          maxLng: Math.max(...lngs),
        }

        estimatedRows = await countByZone(bounds)
      }
    } catch (error: any) {
      console.error('Data source error:', error)
      return NextResponse.json(
        { error: 'Sources de données non configurées. Contactez le support.' },
        { status: 503 }
      )
    }

    // Get credits per result from config (default 10)
    const creditsPerResult = await planConfig.getCreditsPerResult()
    const estimatedCost = estimatedRows * creditsPerResult

    // Create search record with ESTIMATED status
    const search = await prisma.search.create({
      data: {
        organizationId: organization.id,
        userId: session.user.id,
        type,
        criteria,
        estimatedRows,
        estimatedCost,
        status: 'ESTIMATED',
      },
    })

    return NextResponse.json({
      searchId: search.id,
      estimatedRows,
      estimatedCost,
      creditsPerResult,
      currentBalance: organization.creditBalance,
      remainingBalance: organization.creditBalance - estimatedCost,
      canProceed: organization.creditBalance >= estimatedCost,
    })
  } catch (error) {
    console.error('Estimate error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate search' },
      { status: 500 }
    )
  }
}
