import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const orgUser = await prisma.organizationUser.findFirst({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            creditBalance: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!orgUser) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...orgUser.organization,
      role: orgUser.role,
    })
  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}
