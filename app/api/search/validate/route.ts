import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deductCredits } from '@/lib/credits'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchId } = await req.json()

    const search = await prisma.search.findUnique({
      where: { id: searchId },
      include: { organization: true },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Verify user belongs to organization
    if (search.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already validated
    if (search.status !== 'ESTIMATED') {
      return NextResponse.json(
        { error: 'Search already validated or completed' },
        { status: 400 }
      )
    }

    // Check sufficient credits
    if (search.organization.creditBalance < (search.estimatedCost || 0)) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Update search status to VALIDATED
    await prisma.search.update({
      where: { id: searchId },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Search validated, executing...',
    })
  } catch (error) {
    console.error('Validate error:', error)
    return NextResponse.json(
      { error: 'Failed to validate search' },
      { status: 500 }
    )
  }
}
