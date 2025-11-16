import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/super-admin'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { secretKey, publishableKey } = await request.json()

    if (!secretKey || !publishableKey) {
      return NextResponse.json(
        { success: false, error: 'Secret key and publishable key required' },
        { status: 400 }
      )
    }

    // Tester la connexion
    const stripe = new Stripe(secretKey, { apiVersion: '2024-11-20.acacia' })

    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      accountId: account.id,
      email: account.email,
      country: account.country,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
