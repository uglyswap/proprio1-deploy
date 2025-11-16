import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, createAuditLog } from '@/lib/super-admin'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const body = await request.json()

    const planConfig = await prisma.planConfig.update({
      where: { id: params.id },
      data: body,
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'PlanConfig',
      entityId: planConfig.id,
      description: `Plan modifié: ${planConfig.displayName}`,
    })

    return NextResponse.json(planConfig)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const planConfig = await prisma.planConfig.delete({
      where: { id: params.id },
    })

    await createAuditLog({
      action: 'DELETE',
      entity: 'PlanConfig',
      entityId: planConfig.id,
      description: `Plan supprimé: ${planConfig.displayName}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
