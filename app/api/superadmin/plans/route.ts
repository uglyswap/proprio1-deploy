import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, createAuditLog } from '@/lib/super-admin'
import { prisma } from '@/lib/prisma'
import type { SubscriptionPlan } from '@prisma/client'

export async function GET() {
  try {
    await requireSuperAdmin()

    const plans = await prisma.planConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(plans)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()

    const {
      plan,
      displayName,
      description,
      monthlyPrice,
      yearlyPrice,
      monthlyCredits,
      creditsPerResult,
      canUseEnrichment,
      canUseAPI,
      maxTeamMembers,
      maxSearchesPerDay,
      stripePriceIdMonthly,
      stripePriceIdYearly,
      isActive,
      isVisible,
      sortOrder,
    } = body

    const planConfig = await prisma.planConfig.create({
      data: {
        plan: plan as SubscriptionPlan,
        name: plan,
        displayName,
        description,
        monthlyPrice,
        yearlyPrice,
        monthlyCredits,
        creditsPerResult: creditsPerResult || 10,
        canUseEnrichment: canUseEnrichment || false,
        canUseAPI: canUseAPI || false,
        maxTeamMembers: maxTeamMembers || 1,
        maxSearchesPerDay,
        stripePriceIdMonthly,
        stripePriceIdYearly,
        isActive: isActive !== false,
        isVisible: isVisible !== false,
        sortOrder: sortOrder || 0,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entity: 'PlanConfig',
      entityId: planConfig.id,
      description: `Plan créé: ${displayName}`,
    })

    return NextResponse.json(planConfig)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
