import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deductCredits } from '@/lib/credits'
import { generateEnrichmentLinks } from '@/lib/enrichment-links'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchId } = await req.json()

    const search = await prisma.search.findUnique({
      where: { id: searchId },
      include: { organization: true },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Verify search is validated
    if (search.status !== 'VALIDATED') {
      return NextResponse.json(
        { error: 'Search must be validated first' },
        { status: 400 }
      )
    }

    // Execute the actual search based on type
    let results: any[] = []

    if (search.type === 'BY_ADDRESS') {
      const { adresse, codePostal } = search.criteria as any

      // NOTE: Replace 'your_properties_table' with your actual table name
      results = await prisma.$queryRaw`
        SELECT DISTINCT ON (proprietaire_siren)
          id,
          adresse,
          code_postal,
          ville,
          code_commune,
          proprietaire,
          siren,
          company_name,
          type_local,
          surface,
          latitude,
          longitude,
          section,
          numero_parcelle
        FROM your_properties_table
        WHERE adresse ILIKE ${`%${adresse}%`}
        ${codePostal ? `AND code_postal = ${codePostal}` : ''}
        LIMIT 10000
      `
    } else if (search.type === 'BY_OWNER') {
      const { proprietaire, siren } = search.criteria as any

      results = await prisma.$queryRaw`
        SELECT
          id,
          adresse,
          code_postal,
          ville,
          code_commune,
          proprietaire,
          siren,
          company_name,
          type_local,
          surface,
          latitude,
          longitude,
          section,
          numero_parcelle
        FROM your_properties_table
        WHERE ${siren ? `siren = ${siren}` : `proprietaire ILIKE ${`%${proprietaire}%`}`}
        LIMIT 10000
      `
    } else if (search.type === 'BY_ZONE') {
      const { polygon } = search.criteria as any

      // Simple bbox filter (you can add precise polygon check with turf.js)
      const lngs = polygon.map((p: number[]) => p[0])
      const lats = polygon.map((p: number[]) => p[1])

      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      results = await prisma.$queryRaw`
        SELECT DISTINCT ON (proprietaire_siren)
          id,
          adresse,
          code_postal,
          ville,
          code_commune,
          proprietaire,
          siren,
          company_name,
          type_local,
          surface,
          latitude,
          longitude,
          section,
          numero_parcelle
        FROM your_properties_table
        WHERE longitude BETWEEN ${minLng} AND ${maxLng}
        AND latitude BETWEEN ${minLat} AND ${maxLat}
        LIMIT 10000
      `
    }

    const actualRows = results.length
    const actualCost = actualRows

    // Save results to database
    const properties = results.map((result: any) => ({
      searchId: search.id,
      adresse: result.adresse,
      codePostal: result.code_postal,
      ville: result.ville,
      codeCommune: result.code_commune,
      proprietaire: result.proprietaire,
      siren: result.siren,
      companyName: result.company_name,
      typeLocal: result.type_local,
      surface: result.surface,
      latitude: result.latitude,
      longitude: result.longitude,
      section: result.section,
      numeroParcelle: result.numero_parcelle,
    }))

    // Transaction: deduct credits + save results
    await prisma.$transaction(async (tx) => {
      // Save properties
      await tx.property.createMany({
        data: properties,
      })

      // Update search
      await tx.search.update({
        where: { id: searchId },
        data: {
          status: 'COMPLETED',
          actualRows,
          actualCost,
          completedAt: new Date(),
        },
      })

      // Deduct credits
      await deductCredits(
        search.organizationId,
        actualCost,
        'SEARCH_COST',
        `Search: ${search.type}`,
        searchId
      )
    })

    return NextResponse.json({
      success: true,
      actualRows,
      actualCost,
      searchId,
    })
  } catch (error) {
    console.error('Execute error:', error)
    return NextResponse.json(
      { error: 'Failed to execute search' },
      { status: 500 }
    )
  }
}
