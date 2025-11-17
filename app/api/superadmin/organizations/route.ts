import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

const log = apiLogger('/api/superadmin/organizations')

/**
 * GET - Liste toutes les organisations
 * SUPER ADMIN ONLY
 */
export async function GET() {
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
      log.warn({ userId: session.user.id }, 'Non-SuperAdmin tried to access organizations')
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const organizations = await prisma.organization.findMany({
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

    log.info({ count: organizations.length }, 'Fetched organizations')

    return NextResponse.json({ organizations })
  } catch (error) {
    logError(error, {
      component: 'superadmin',
      action: 'get-organizations',
    })

    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
