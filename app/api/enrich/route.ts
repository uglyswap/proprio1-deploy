import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Queue } from 'bullmq'

const enrichmentQueue = new Queue('contact-enrichment', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchId } = await req.json()

    const search = await prisma.search.findUnique({
      where: { id: searchId },
      include: {
        organization: true,
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Verify user access
    if (search.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check plan allows enrichment
    if (search.organization.plan === 'FREE' || search.organization.plan === 'BASIC') {
      return NextResponse.json(
        { error: 'Enrichment is only available for PRO and ENTERPRISE plans' },
        { status: 403 }
      )
    }

    // Check search is completed
    if (search.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Search must be completed before enrichment' },
        { status: 400 }
      )
    }

    // Check if already enriching or enriched
    if (search.status === 'ENRICHING' || search.status === 'ENRICHED') {
      return NextResponse.json(
        { error: 'Search already enriched or enriching' },
        { status: 400 }
      )
    }

    // Update search status
    await prisma.search.update({
      where: { id: searchId },
      data: {
        status: 'ENRICHING',
        enrichRequested: true,
      },
    })

    // Add to queue
    const job = await enrichmentQueue.add('enrich-contacts', {
      searchId,
      organizationId: search.organizationId,
    })

    return NextResponse.json({
      success: true,
      message: 'Enrichment started',
      jobId: job.id,
      estimatedTime: (search.actualRows || 0) * 2, // ~2 seconds per contact
    })
  } catch (error) {
    console.error('Enrich error:', error)
    return NextResponse.json(
      { error: 'Failed to start enrichment' },
      { status: 500 }
    )
  }
}

// Get enrichment status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchId = req.nextUrl.searchParams.get('searchId')

    if (!searchId) {
      return NextResponse.json({ error: 'searchId required' }, { status: 400 })
    }

    const search = await prisma.search.findUnique({
      where: { id: searchId },
      select: {
        status: true,
        enrichedAt: true,
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: search.status,
      enrichedAt: search.enrichedAt,
    })
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
