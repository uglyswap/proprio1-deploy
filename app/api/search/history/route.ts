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

    // Get user's searches
    const searches = await prisma.search.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['COMPLETED', 'ENRICHED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        status: true,
        actualRows: true,
        actualCost: true,
        createdAt: true,
        enrichedAt: true,
      },
      take: 100,
    })

    return NextResponse.json(searches)
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
