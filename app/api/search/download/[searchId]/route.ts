import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEnrichmentLinks } from '@/lib/enrichment-links'

export async function GET(
  req: NextRequest,
  { params }: { params: { searchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const search = await prisma.search.findUnique({
      where: { id: params.searchId },
      include: {
        properties: true,
        organization: true,
      },
    })

    if (!search) {
      return new NextResponse('Search not found', { status: 404 })
    }

    // Verify user access
    if (search.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    // Verify search is completed
    if (search.status !== 'COMPLETED' && search.status !== 'ENRICHED') {
      return new NextResponse('Search not completed yet', { status: 400 })
    }

    // Generate CSV with enrichment links
    const headers = [
      'Adresse',
      'Code Postal',
      'Ville',
      'Propriétaire',
      'SIREN',
      'Type',
      'Surface (m²)',
      'Lien Google Maps',
      'Lien Street View',
      'Lien Pappers',
      'Lien Cadastre',
      'Lien DVF (Transactions)',
      'Lien Géoportail',
      'Email',
      'Téléphone',
      'Mobile',
      'LinkedIn',
    ]

    const rows = search.properties.map((property) => {
      const links = property.latitude && property.longitude
        ? generateEnrichmentLinks({
            adresse: property.adresse,
            codePostal: property.codePostal || '',
            ville: property.ville || '',
            codeCommune: property.codeCommune || '',
            latitude: Number(property.latitude),
            longitude: Number(property.longitude),
            siren: property.siren || undefined,
            section: property.section || undefined,
            numeroParcelle: property.numeroParcelle || undefined,
          })
        : null

      return [
        property.adresse,
        property.codePostal || '',
        property.ville || '',
        property.proprietaire,
        property.siren || '',
        property.typeLocal || '',
        property.surface?.toString() || '',
        links?.googleMaps || '',
        links?.streetView || '',
        links?.pappers || '',
        links?.cadastre || '',
        links?.dvf || '',
        links?.geoportail || '',
        property.email || '',
        property.phone || '',
        property.mobilePhone || '',
        property.linkedin || '',
      ]
        .map((field) => `"${field}"`)
        .join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    const filename = `proprietaires_${search.type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse('Failed to download results', { status: 500 })
  }
}
