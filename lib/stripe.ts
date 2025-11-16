import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_PLANS = {
  BASIC: {
    name: 'Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    price: 2900, // 29€
    credits: 500,
    features: [
      '500 lignes incluses',
      'Données brutes + liens',
      'Support par email',
      '0,06€/ligne supplémentaire'
    ]
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 9900, // 99€
    credits: 3000,
    features: [
      '3 000 lignes incluses',
      'Données brutes + liens',
      'Enrichissement contact (email/téléphone)',
      'Support prioritaire',
      '0,04€/ligne supplémentaire'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    price: 34900, // 349€
    credits: 20000,
    features: [
      '20 000 lignes incluses',
      'Toutes données enrichies',
      'Enrichissement prioritaire',
      'Support dédié',
      'Accès API',
      '0,03€/ligne supplémentaire'
    ]
  }
}

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateStripeCustomer(
  email: string,
  organizationId: string,
  organizationName: string
): Promise<string> {
  const existingOrg = await prisma?.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true }
  })

  if (existingOrg?.stripeCustomerId) {
    return existingOrg.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      organizationId,
      organizationName
    }
  })

  // Save to database
  await prisma?.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id }
  })

  return customer.id
}

/**
 * Create checkout session
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  organizationId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId,
    },
  })

  return session
}

/**
 * Create portal session (for managing subscription)
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}
