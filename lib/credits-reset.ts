/**
 * Système de reset mensuel des crédits
 * Les crédits NE s'accumulent PAS, ils se rechargent chaque mois
 */

import { prisma } from './prisma'
import { addCredits } from './credits'

/**
 * Vérifie si une organisation a besoin d'un reset de crédits
 */
export async function checkCreditsReset(organizationId: string): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      creditsResetAt: true,
      monthlyCredits: true,
    },
  })

  if (!organization) {
    return false
  }

  const now = new Date()
  const lastReset = organization.creditsResetAt

  // Si jamais de reset, on fait le premier
  if (!lastReset) {
    await resetOrganizationCredits(organizationId)
    return true
  }

  // Vérifier si un mois s'est écoulé
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  if (lastReset < oneMonthAgo) {
    await resetOrganizationCredits(organizationId)
    return true
  }

  return false
}

/**
 * Reset les crédits d'une organisation
 */
export async function resetOrganizationCredits(organizationId: string): Promise<void> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      monthlyCredits: true,
      plan: true,
    },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Si l'organisation n'a pas de crédits mensuels configurés, récupérer depuis le plan
  let monthlyCredits = organization.monthlyCredits

  if (monthlyCredits === 0) {
    const planConfig = await prisma.planConfig.findUnique({
      where: { plan: organization.plan },
    })

    if (planConfig) {
      monthlyCredits = planConfig.monthlyCredits
    }
  }

  // Reset: remettre le solde à monthlyCredits
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      creditBalance: monthlyCredits,
      creditsResetAt: new Date(),
    },
  })

  // Logger la transaction
  await prisma.creditTransaction.create({
    data: {
      organizationId,
      amount: monthlyCredits,
      type: 'SUBSCRIPTION',
      description: `Reset mensuel - ${monthlyCredits} crédits`,
    },
  })
}

/**
 * Vérifie et reset les crédits pour toutes les organisations
 * À appeler quotidiennement via CRON
 */
export async function resetAllOrganizationsCredits(): Promise<number> {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  // Trouver toutes les organisations qui ont besoin d'un reset
  const organizations = await prisma.organization.findMany({
    where: {
      isActive: true,
      plan: { not: 'FREE' },
      OR: [
        { creditsResetAt: null },
        { creditsResetAt: { lt: oneMonthAgo } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  })

  let count = 0

  for (const org of organizations) {
    try {
      await resetOrganizationCredits(org.id)
      count++
      console.log(`✅ Reset crédits pour ${org.name}`)
    } catch (error) {
      console.error(`❌ Erreur reset crédits pour ${org.name}:`, error)
    }
  }

  return count
}

/**
 * Récupère la date du prochain reset pour une organisation
 */
export async function getNextResetDate(organizationId: string): Promise<Date | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { creditsResetAt: true },
  })

  if (!organization?.creditsResetAt) {
    return null
  }

  const nextReset = new Date(organization.creditsResetAt)
  nextReset.setMonth(nextReset.getMonth() + 1)

  return nextReset
}
