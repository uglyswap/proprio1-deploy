import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/super-admin'
import { apiLogger, logError } from '@/lib/logger'

const log = apiLogger('/api/superadmin/impersonate')

/**
 * Impersonation - Se connecter en tant qu'un client
 * SUPER ADMIN ONLY
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vérifier super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    })

    if (!user?.isSuperAdmin) {
      log.warn({ userId: session.user.id }, 'Non-SuperAdmin tried to impersonate')
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Récupérer l'organisation et son owner
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: { user: true },
          take: 1,
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Log d'audit
    await createAuditLog({
      action: 'IMPERSONATE',
      entity: 'Organization',
      entityId: organizationId,
      description: `SuperAdmin ${session.user.email} impersonated ${organization.name}`,
      organizationId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    log.info({
      superAdminId: session.user.id,
      organizationId,
      organizationName: organization.name,
    }, 'SuperAdmin impersonated organization')

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        creditBalance: organization.creditBalance,
      },
      redirectUrl: '/dashboard',
    })
  } catch (error) {
    logError(error, {
      component: 'superadmin',
      action: 'impersonate',
    })

    return NextResponse.json(
      { error: 'Failed to impersonate organization' },
      { status: 500 }
    )
  }
}
