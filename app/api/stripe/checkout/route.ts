import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserOrganization } from '@/lib/auth'
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe'
import { validateRequest, stripeCheckoutSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
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

    // ✅ SÉCURITÉ: Validation Zod du priceId
    const validation = await validateRequest(req, stripeCheckoutSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { priceId } = validation.data

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.email!,
      organization.id,
      organization.name
    )

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      priceId,
      organization.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
