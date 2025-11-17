/**
 * 🚀 PRISMA QUERY OPTIMIZATION HELPERS
 *
 * Helpers pour optimiser les queries Prisma:
 * - Select ciblés (évite de charger toutes les colonnes)
 * - Pagination standardisée
 * - Count optimisé
 */

/**
 * Select fields pour queries fréquentes (évite de charger tout)
 */
export const PrismaSelects = {
  // User minimal (pour auth, sessions)
  userMinimal: {
    id: true,
    email: true,
    name: true,
    image: true,
  },

  // User avec admin flag
  userWithAdmin: {
    id: true,
    email: true,
    name: true,
    image: true,
    isSuperAdmin: true,
  },

  // Organization minimal
  organizationMinimal: {
    id: true,
    name: true,
    slug: true,
    plan: true,
    creditBalance: true,
  },

  // Organization complète pour dashboard
  organizationFull: {
    id: true,
    name: true,
    slug: true,
    plan: true,
    creditBalance: true,
    creditsResetAt: true,
    monthlyCredits: true,
    isActive: true,
    canUseEnrichment: true,
    createdAt: true,
    updatedAt: true,
  },

  // Search minimal (liste)
  searchMinimal: {
    id: true,
    type: true,
    status: true,
    estimatedRows: true,
    estimatedCost: true,
    actualRows: true,
    actualCost: true,
    createdAt: true,
    completedAt: true,
  },

  // Search avec user
  searchWithUser: {
    id: true,
    type: true,
    status: true,
    estimatedRows: true,
    actualRows: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },

  // Credit transaction
  creditTransaction: {
    id: true,
    amount: true,
    type: true,
    description: true,
    createdAt: true,
  },
} as const

/**
 * Pagination standardisée
 */
export interface PaginationParams {
  page?: number // 1-indexed
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Helper pour calculer skip/take Prisma
 */
export function getPaginationArgs(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(Math.max(1, params.limit || 20), 100) // Max 100

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  }
}

/**
 * Helper pour formater résultat paginé
 */
export function formatPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Helper pour query paginée optimisée
 * Execute count et query en parallèle
 */
export async function paginatedQuery<T>(
  countPromise: Promise<number>,
  dataPromise: Promise<T[]>,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const { page, limit } = getPaginationArgs(params)

  // Execute en parallèle pour perfs
  const [total, data] = await Promise.all([countPromise, dataPromise])

  return formatPaginatedResult(data, total, page, limit)
}

/**
 * Date range filters helpers
 */
export function getDateRangeFilter(days: number) {
  const now = new Date()
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return {
    gte: start,
    lte: now,
  }
}

/**
 * Optimized search filters
 */
export function buildSearchFilters(params: {
  organizationId: string
  status?: string[]
  type?: string[]
  dateRange?: number
}) {
  const where: any = {
    organizationId: params.organizationId,
  }

  if (params.status && params.status.length > 0) {
    where.status = { in: params.status }
  }

  if (params.type && params.type.length > 0) {
    where.type = { in: params.type }
  }

  if (params.dateRange) {
    where.createdAt = getDateRangeFilter(params.dateRange)
  }

  return where
}
