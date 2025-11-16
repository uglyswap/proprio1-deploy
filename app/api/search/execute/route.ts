import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deductCredits } from '@/lib/credits'
import { searchByAddress, searchByOwner, searchByZone } from '@/lib/data-crosser'
import { planConfig } from '@/lib/system-config'

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

    // Execute search using data-crosser (with SIRENE enrichment)
    let results: any[] = []

    try {
      if (search.type === 'BY_ADDRESS') {
        const { adresse, codePostal } = search.criteria as any
        results = await searchByAddress(adresse, codePostal)
      } else if (search.type === 'BY_OWNER') {
        const { proprietaire, siren } = search.criteria as any
        results = await searchByOwner(proprietaire, siren)
      } else if (search.type === 'BY_ZONE') {
        const { polygon } = search.criteria as any

        const lngs = polygon.map((p: number[]) => p[0])
        const lats = polygon.map((p: number[]) => p[1])

        const bounds = {
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          minLng: Math.min(...lngs),
          maxLng: Math.max(...lngs),
        }

        results = await searchByZone(bounds)
      }
    } catch (error: any) {
      console.error('Data source error:', error)
      return NextResponse.json(
        { error: 'Sources de données non configurées. Contactez le support.' },
        { status: 503 }
      )
    }

    const actualRows = results.length

    // Get credits per result from config
    const creditsPerResult = await planConfig.getCreditsPerResult()
    const actualCost = actualRows * creditsPerResult

    // Save results to database with SIRENE enrichment
    const properties = results.map((result: any) => ({
      searchId: search.id,
      adresse: result.adresse,
      codePostal: result.codePostal,
      ville: result.ville,
      codeCommune: result.codeCommune,
      departement: result.departement,
      proprietaire: result.proprietaire,
      siren: result.siren,
      companyName: result.companyName, // From SIRENE
      dirigeantNom: result.dirigeantNom, // From SIRENE ✅
      dirigeantPrenom: result.dirigeantPrenom, // From SIRENE ✅
      dirigeantQualite: result.dirigeantQualite, // From SIRENE ✅
      siegeAdresse: result.siegeAdresse, // From SIRENE ✅
      siegeCodePostal: result.siegeCodePostal, // From SIRENE ✅
      siegeVille: result.siegeVille, // From SIRENE ✅
      typeLocal: result.typeLocal,
      surface: result.surface,
      latitude: result.latitude,
      longitude: result.longitude,
      section: result.section,
      numeroParcelle: result.numeroParcelle,
    }))

    // Transaction: deduct credits + save results
    await prisma.$transaction(async (tx) => {
      // Save properties with enrichment
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
        `Search: ${search.type} (${actualRows} résultats × ${creditsPerResult} crédits)`,
        searchId
      )
    })

    return NextResponse.json({
      success: true,
      actualRows,
      actualCost,
      creditsPerResult,
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
