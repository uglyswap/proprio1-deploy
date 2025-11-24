import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/lib/credits'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { webhookLogger, logError, logSuccess } from '@/lib/logger'

const log = webhookLogger('stripe')

const PLAN_CREDITS: Record<SubscriptionPlan, number> = {
  FREE: 0,         // Free plan has no credits
  BASIC: 500,      // 500 crédits = ~50 résultats (pricing page ✓)
  PRO: 2000,       // 2000 crédits = ~200 résultats (pricing page ✓)
  ENTERPRISE: 10000, // 10000 crédits = ~1000 résultats (pricing page ✓)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    log.debug({ eventType: event.type }, 'Webhook signature verified')
  } catch (error) {
    logError(error, {
      component: 'webhook',
      action: 'signature_verification',
    })
    return new NextResponse('Webhook Error', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organizationId

        if (!organizationId) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await handleSubscriptionCreated(organizationId, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const organization = await prisma.organization.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        })

        if (organization) {
          await handlePaymentSucceeded(organization.id, subscription)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const organization = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (organization) {
          await handleSubscriptionUpdated(organization.id, subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const organization = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (organization) {
          await handleSubscriptionDeleted(organization.id)
        }
        break
      }
    }

    log.info({ eventType: event.type }, 'Webhook processed successfully')
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    logError(error, {
      component: 'webhook',
      action: 'process_event',
      metadata: { eventType: event.type },
    })
    return new NextResponse('Webhook Error', { status: 500 })
  }
}

async function handleSubscriptionCreated(
  organizationId: string,
  subscription: Stripe.Subscription
) {
  const plan = getPlanFromPriceId(subscription.items.data[0].price.id)

  await prisma.subscription.create({
    data: {
      organizationId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan,
      status: subscription.status.toUpperCase() as SubscriptionStatus,
    },
  })

  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan },
  })

  // Add credits
  const credits = PLAN_CREDITS[plan]
  if (credits > 0) {
    await addCredits(
      organizationId,
      credits,
      'SUBSCRIPTION',
      `${plan} plan - monthly credits`
    )
  }
}

async function handlePaymentSucceeded(
  organizationId: string,
  subscription: Stripe.Subscription
) {
  const plan = getPlanFromPriceId(subscription.items.data[0].price.id)

  // Renew monthly credits
  const credits = PLAN_CREDITS[plan]
  if (credits > 0) {
    await addCredits(
      organizationId,
      credits,
      'SUBSCRIPTION',
      `${plan} plan - monthly renewal`
    )
  }
}

async function handleSubscriptionUpdated(
  organizationId: string,
  subscription: Stripe.Subscription
) {
  const plan = getPlanFromPriceId(subscription.items.data[0].price.id)

  await prisma.subscription.updateMany({
    where: {
      organizationId,
      stripeSubscriptionId: subscription.id,
    },
    data: {
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan,
      status: subscription.status.toUpperCase() as SubscriptionStatus,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  })

  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan },
  })
}

async function handleSubscriptionDeleted(organizationId: string) {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan: 'FREE' },
  })
}

function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return 'BASIC'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO'
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'ENTERPRISE'

  // ❌ SÉCURITÉ: Ne jamais retourner FREE pour un prix inconnu
  // Un client qui paie doit toujours recevoir son plan
  throw new Error(`Unknown Stripe price ID: ${priceId}. Cannot determine subscription plan.`)
}
