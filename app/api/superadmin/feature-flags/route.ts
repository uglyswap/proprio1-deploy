import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

const log = apiLogger('/api/superadmin/feature-flags')

/**
 * GET - Liste toutes les feature flags
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
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const flags = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ flags })
  } catch (error) {
    logError(error, {
      component: 'superadmin',
      action: 'get-feature-flags',
    })

    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 })
  }
}

/**
 * POST - Créer ou update une feature flag
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
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { id, name, description, isEnabled, rolloutPercent, allowedPlans } = await req.json()

    let flag

    if (id) {
      // Update
      flag = await prisma.featureFlag.update({
        where: { id },
        data: {
          name,
          description,
          isEnabled,
          rolloutPercent: rolloutPercent || 100,
          allowedPlans: allowedPlans || [],
        },
      })

      log.info({ flagId: id, name, isEnabled }, 'Feature flag updated')
    } else {
      // Create
      flag = await prisma.featureFlag.create({
        data: {
          name,
          description,
          isEnabled: isEnabled ?? false,
          rolloutPercent: rolloutPercent || 100,
          allowedPlans: allowedPlans || [],
        },
      })

      log.info({ flagId: flag.id, name }, 'Feature flag created')
    }

    return NextResponse.json({ flag })
  } catch (error) {
    logError(error, {
      component: 'superadmin',
      action: 'create-update-feature-flag',
    })

    return NextResponse.json({ error: 'Failed to save feature flag' }, { status: 500 })
  }
}

/**
 * DELETE - Supprimer une feature flag
 */
export async function DELETE(req: NextRequest) {
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
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.featureFlag.delete({
      where: { id },
    })

    log.info({ flagId: id }, 'Feature flag deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, {
      component: 'superadmin',
      action: 'delete-feature-flag',
    })

    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 })
  }
}
