import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserOrganization } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPaginationArgs,
  paginatedQuery,
  PrismaSelects,
} from '@/lib/prisma-helpers'
import { apiLogger, logError } from '@/lib/logger'

const log = apiLogger('/api/search/history')

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ SÉCURITÉ: Vérifier l'organisation
    const organization = await getUserOrganization(session.user.id)
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // ✅ PERFORMANCE: Pagination depuis query params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // optional filter

    const { skip, take } = getPaginationArgs({ page, limit })

    // Build filters
    const where: any = {
      organizationId: organization.id,
      userId: session.user.id,
    }

    if (status) {
      where.status = { in: status.split(',') }
    } else {
      where.status = { in: ['COMPLETED', 'ENRICHED'] }
    }

    // ✅ PERFORMANCE: Count et data en parallèle
    const result = await paginatedQuery(
      prisma.search.count({ where }),
      prisma.search.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          ...PrismaSelects.searchMinimal,
          enrichedAt: true,
        },
        skip,
        take,
      }),
      { page, limit }
    )

    const duration = Date.now() - startTime
    log.debug(
      {
        userId: session.user.id,
        organizationId: organization.id,
        page,
        limit,
        total: result.pagination.total,
        duration,
      },
      'Search history fetched'
    )

    return NextResponse.json(result)
  } catch (error) {
    const duration = Date.now() - startTime
    logError(error, {
      component: 'api',
      action: 'get_search_history',
      metadata: { duration },
    })

    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
