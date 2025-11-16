import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserOrganization } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deductCredits } from '@/lib/credits'
import { validateRequest, searchValidateSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ SÉCURITÉ: Validation Zod des inputs
    const validation = await validateRequest(req, searchValidateSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { searchId } = validation.data

    const search = await prisma.search.findUnique({
      where: { id: searchId },
      include: { organization: true },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // ✅ SÉCURITÉ: Vérifier que l'utilisateur appartient à l'organisation
    const userOrg = await getUserOrganization(session.user.id)
    if (!userOrg || search.organizationId !== userOrg.id) {
      return NextResponse.json({ error: 'Unauthorized - Organization mismatch' }, { status: 403 })
    }

    // Verify user is the one who created the search
    if (search.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Not your search' }, { status: 403 })
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
