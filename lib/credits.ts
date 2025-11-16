import { prisma } from './prisma'
import { TransactionType } from '@prisma/client'

/**
 * Get organization credit balance
 */
export async function getOrganizationCredits(organizationId: string): Promise<number> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { creditBalance: true }
  })

  return org?.creditBalance ?? 0
}

/**
 * Add credits to an organization
 */
export async function addCredits(
  organizationId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  searchId?: string
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    // Update organization balance
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: {
        creditBalance: {
          increment: amount
        }
      }
    })

    // Log transaction
    await tx.creditTransaction.create({
      data: {
        organizationId,
        amount,
        type,
        description,
        searchId
      }
    })

    return org.creditBalance
  })

  return result
}

/**
 * Deduct credits from an organization
 */
export async function deductCredits(
  organizationId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  searchId?: string
): Promise<number> {
  // Check if sufficient credits
  const currentBalance = await getOrganizationCredits(organizationId)

  if (currentBalance < amount) {
    throw new Error('Insufficient credits')
  }

  const result = await prisma.$transaction(async (tx) => {
    // Deduct from organization
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: {
        creditBalance: {
          decrement: amount
        }
      }
    })

    // Log transaction
    await tx.creditTransaction.create({
      data: {
        organizationId,
        amount: -amount,
        type,
        description,
        searchId
      }
    })

    return org.creditBalance
  })

  return result
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(
  organizationId: string,
  limit: number = 50
) {
  return prisma.creditTransaction.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      search: {
        select: {
          id: true,
          type: true,
          criteria: true
        }
      }
    }
  })
}
