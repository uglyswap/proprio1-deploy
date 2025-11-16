/**
 * Utilitaires Super Admin
 */

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import type { AuditAction } from '@prisma/client'

/**
 * Vérifie si l'utilisateur courant est super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isSuperAdmin: true },
  })

  return user?.isSuperAdmin || false
}

/**
 * Vérifie et lève une erreur si pas super admin
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin()

  if (!isAdmin) {
    throw new Error('Super admin access required')
  }
}

/**
 * Récupère l'utilisateur super admin courant
 */
export async function getSuperAdminUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user?.isSuperAdmin) {
    return null
  }

  return user
}

/**
 * Crée un log d'audit
 */
export async function createAuditLog(params: {
  action: AuditAction
  entity?: string
  entityId?: string
  description?: string
  metadata?: any
  organizationId?: string
  ipAddress?: string
  userAgent?: string
}) {
  const user = await getSuperAdminUser()

  return prisma.auditLog.create({
    data: {
      userId: user?.id,
      organizationId: params.organizationId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

/**
 * Récupère les métriques business
 */
export async function getBusinessMetrics() {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Nombre total de clients
  const totalCustomers = await prisma.organization.count({
    where: { isActive: true },
  })

  // Nouveaux clients ce mois
  const newCustomersThisMonth = await prisma.organization.count({
    where: {
      isActive: true,
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Répartition par plan
  const customersByPlan = await prisma.organization.groupBy({
    by: ['plan'],
    where: { isActive: true },
    _count: true,
  })

  // MRR (Monthly Recurring Revenue)
  const planConfigs = await prisma.planConfig.findMany()
  const planPrices = new Map(
    planConfigs.map(p => [p.plan, Number(p.monthlyPrice)])
  )

  let mrr = 0
  customersByPlan.forEach(({ plan, _count }) => {
    const price = planPrices.get(plan) || 0
    mrr += price * _count
  })

  // Recherches ce mois
  const searchesThisMonth = await prisma.search.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: 'COMPLETED',
    },
  })

  // Crédits consommés ce mois
  const creditsConsumed = await prisma.creditTransaction.aggregate({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      type: 'SEARCH_COST',
    },
    _sum: { amount: true },
  })

  // Coûts enrichissement ce mois
  const enrichmentCosts = await prisma.enrichmentLog.aggregate({
    where: {
      completedAt: { gte: thirtyDaysAgo },
    },
    _sum: { cost: true },
  })

  return {
    totalCustomers,
    newCustomersThisMonth,
    customersByPlan: customersByPlan.map(({ plan, _count }) => ({
      plan,
      count: _count,
      revenue: (planPrices.get(plan) || 0) * _count,
    })),
    mrr,
    arr: mrr * 12,
    searchesThisMonth,
    creditsConsumed: Math.abs(creditsConsumed._sum.amount || 0),
    enrichmentCosts: Number(enrichmentCosts._sum.cost || 0),
    profit: mrr - Number(enrichmentCosts._sum.cost || 0),
  }
}

/**
 * Récupère les clients récents
 */
export async function getRecentCustomers(limit: number = 10) {
  return prisma.organization.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        include: { user: true },
      },
      _count: {
        select: {
          searches: true,
          users: true,
        },
      },
    },
  })
}

/**
 * Impersonation - Se connecter en tant qu'un client
 */
export async function impersonateOrganization(organizationId: string) {
  await requireSuperAdmin()

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        include: { user: true },
        where: { role: 'OWNER' },
      },
    },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  await createAuditLog({
    action: 'IMPERSONATE',
    entity: 'Organization',
    entityId: organizationId,
    description: `Impersonation de l'organisation ${organization.name}`,
    organizationId,
  })

  return organization
}

/**
 * Met à jour les métriques quotidiennes
 */
export async function updateDailyMetrics(date: Date = new Date()) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Total customers
  const totalCustomers = await prisma.organization.count({
    where: { isActive: true },
  })

  // New customers today
  const newCustomers = await prisma.organization.count({
    where: {
      isActive: true,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  // Churned customers today
  const churnedCustomers = await prisma.organization.count({
    where: {
      isActive: false,
      updatedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  // Active customers with subscriptions
  const activeCustomers = await prisma.organization.count({
    where: {
      isActive: true,
      plan: { not: 'FREE' },
    },
  })

  // MRR calculation
  const planConfigs = await prisma.planConfig.findMany()
  const planPrices = new Map(
    planConfigs.map(p => [p.plan, Number(p.monthlyPrice)])
  )

  const customersByPlan = await prisma.organization.groupBy({
    by: ['plan'],
    where: { isActive: true },
    _count: true,
  })

  let mrr = 0
  customersByPlan.forEach(({ plan, _count }) => {
    const price = planPrices.get(plan) || 0
    mrr += price * _count
  })

  // Searches today
  const totalSearches = await prisma.search.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'COMPLETED',
    },
  })

  // Results today
  const searchResults = await prisma.search.aggregate({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'COMPLETED',
    },
    _sum: { actualRows: true },
  })

  // Credits consumed
  const creditsConsumed = await prisma.creditTransaction.aggregate({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      type: 'SEARCH_COST',
    },
    _sum: { amount: true },
  })

  // Credits allocated
  const creditsAllocated = await prisma.creditTransaction.aggregate({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      type: { in: ['SUBSCRIPTION', 'PURCHASE'] },
    },
    _sum: { amount: true },
  })

  // Enrichment costs
  const enrichmentCosts = await prisma.enrichmentLog.aggregate({
    where: {
      completedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    _sum: { cost: true },
  })

  // Upsert metrics
  await prisma.dailyMetrics.upsert({
    where: { date: startOfDay },
    update: {
      mrr,
      totalCustomers,
      newCustomers,
      churnedCustomers,
      activeCustomers,
      totalSearches,
      totalResults: searchResults._sum.actualRows || 0,
      creditsConsumed: Math.abs(creditsConsumed._sum.amount || 0),
      creditsAllocated: creditsAllocated._sum.amount || 0,
      enrichmentCosts: enrichmentCosts._sum.cost || 0,
      updatedAt: new Date(),
    },
    create: {
      date: startOfDay,
      mrr,
      totalCustomers,
      newCustomers,
      churnedCustomers,
      activeCustomers,
      totalSearches,
      totalResults: searchResults._sum.actualRows || 0,
      creditsConsumed: Math.abs(creditsConsumed._sum.amount || 0),
      creditsAllocated: creditsAllocated._sum.amount || 0,
      enrichmentCosts: enrichmentCosts._sum.cost || 0,
    },
  })
}
