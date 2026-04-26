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
    // 🔒 SÉCURITÉ: Idempotency - check if event was already processed
    const existingEvent = await prisma.auditLog.findFirst({
      where: {
        action: 'API_CALL',
        entity: 'StripeWebhook',
        entityId: event.id,
      },
    })

    if (existingEvent) {
      log.info({ eventId: event.id, eventType: event.type }, 'Webhook event already processed (idempotency)')
      return new NextResponse(null, { status: 200 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organizationId

        if (!organizationId) break

        // ✅ FIX: Check if subscription already exists (idempotency)
        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: session.subscription as string },
        })

        if (existingSub) {
          log.warn({ subscriptionId: session.subscription }, 'Subscription already exists, skipping')
          break
        }

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
          await handleSubscriptionDeleted(organization.id, subscription)
        }
        break
      }
    }

    // Record event as processed for idempotency
    await prisma.auditLog.create({
      data: {
        action: 'API_CALL',
        entity: 'StripeWebhook',
        entityId: event.id,
        description: `Stripe webhook event processed: ${event.type}`,
        metadata: { eventType: event.type },
      },
    })

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
  if (!plan) {
    log.error({ priceId: subscription.items.data[0].price.id }, 'Cannot determine plan for subscription')
    return
  }

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
  // ⚠️ Prevent double crediting:
  // 'invoice.payment_succeeded' is triggered for the first payment (subscription creation).
  // But 'checkout.session.completed' already handles the initial credits.
  // We only want to add credits for renewals (recurring payments).
  const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string)
  if (invoice.billing_reason === 'subscription_create') {
    return
  }

  const plan = getPlanFromPriceId(subscription.items.data[0].price.id)
  if (!plan) {
    log.error({ priceId: subscription.items.data[0].price.id }, 'Cannot determine plan for payment')
    return
  }

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
  if (!plan) {
    log.error({ priceId: subscription.items.data[0].price.id }, 'Cannot determine plan for update')
    return
  }

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

async function handleSubscriptionDeleted(organizationId: string, subscription: Stripe.Subscription) {
  // Update the subscription record
  await prisma.subscription.updateMany({
    where: {
      organizationId,
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: false,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : new Date(),
    },
  })

  // Downgrade organization plan to FREE
  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan: 'FREE' },
  })

  log.info({ organizationId }, 'Subscription deleted, organization downgraded to FREE')
}

function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return 'BASIC'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO'
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'ENTERPRISE'

  // ✅ FIX: Log error instead of throwing — throwing crashes the webhook handler
  console.error(`[Stripe Webhook] Unknown price ID: ${priceId}`)
  return null
}
