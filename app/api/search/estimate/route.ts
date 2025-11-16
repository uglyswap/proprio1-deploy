import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserOrganization } from '@/lib/auth'
import { SearchType } from '@prisma/client'

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

    // Build query based on search type
    let estimatedRows = 0

    if (type === 'BY_ADDRESS') {
      // Count properties at this address
      const { adresse, codePostal } = criteria

      estimatedRows = await prisma.$queryRaw<number>`
        SELECT COUNT(DISTINCT proprietaire_siren)::int
        FROM your_properties_table
        WHERE adresse ILIKE ${`%${adresse}%`}
        ${codePostal ? `AND code_postal = ${codePostal}` : ''}
      `
    } else if (type === 'BY_OWNER') {
      // Count properties owned by this proprietaire
      const { proprietaire, siren } = criteria

      estimatedRows = await prisma.$queryRaw<number>`
        SELECT COUNT(*)::int
        FROM your_properties_table
        WHERE ${siren ? `siren = ${siren}` : `proprietaire ILIKE ${`%${proprietaire}%`}`}
      `
    } else if (type === 'BY_ZONE') {
      // Count properties in geographic zone
      const { polygon } = criteria

      // Build bbox for quick filter
      const lngs = polygon.map((p: number[]) => p[0])
      const lats = polygon.map((p: number[]) => p[1])

      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      estimatedRows = await prisma.$queryRaw<number>`
        SELECT COUNT(DISTINCT proprietaire_siren)::int
        FROM your_properties_table
        WHERE longitude BETWEEN ${minLng} AND ${maxLng}
        AND latitude BETWEEN ${minLat} AND ${maxLat}
      `
    }

    const estimatedCost = estimatedRows // 1 crédit par ligne

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
