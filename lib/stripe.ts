import Stripe from 'stripe'

// Lazy initialization - only create Stripe instance when actually needed
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }
  return stripeInstance
}

// For backward compatibility
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get billingPortal() { return getStripe().billingPortal },
  get subscriptions() { return getStripe().subscriptions },
  get webhooks() { return getStripe().webhooks },
  get invoices() { return getStripe().invoices },
}

export const STRIPE_PLANS = {
  BASIC: {
    name: 'Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
    price: 2900, // 29 EUR
    credits: 500,
    features: [
      '500 lignes incluses',
      'Donnees brutes + liens',
      'Support par email',
      '0,06 EUR/ligne supplementaire'
    ]
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    price: 9900, // 99 EUR
    credits: 3000,
    features: [
      '3 000 lignes incluses',
      'Donnees brutes + liens',
      'Enrichissement contact (email/telephone)',
      'Support prioritaire',
      '0,04 EUR/ligne supplementaire'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    price: 34900, // 349 EUR
    credits: 20000,
    features: [
      '20 000 lignes incluses',
      'Toutes donnees enrichies',
      'Enrichissement prioritaire',
      'Support dedie',
      'Acces API',
      '0,03 EUR/ligne supplementaire'
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
  const { prisma } = await import('@/lib/prisma')

  const existingOrg = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true }
  })

  if (existingOrg?.stripeCustomerId) {
    return existingOrg.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await getStripe().customers.create({
    email,
    metadata: {
      organizationId,
      organizationName
    }
  })

  // Save to database
  await prisma.organization.update({
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
  const session = await getStripe().checkout.sessions.create({
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
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}
