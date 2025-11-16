import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserOrganization } from '@/lib/auth'
import { getCreditTransactions } from '@/lib/credits'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await getUserOrganization(session.user.id)

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    const transactions = await getCreditTransactions(organization.id)

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
