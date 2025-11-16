/**
 * Gestionnaire de configuration système
 * Permet au super admin de configurer le SaaS via UI
 */

import { prisma } from './prisma'
import { encrypt, decrypt } from './encryption'
import type { ConfigCategory } from '@prisma/client'

/**
 * Récupère une valeur de configuration
 */
export async function getConfig(key: string): Promise<string | null> {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  })

  if (!config || !config.value) {
    return null
  }

  return config.isEncrypted ? decrypt(config.value) : config.value
}

/**
 * Définit une valeur de configuration
 */
export async function setConfig(
  key: string,
  value: string,
  category: ConfigCategory,
  description?: string,
  shouldEncrypt: boolean = false
): Promise<void> {
  const finalValue = shouldEncrypt ? encrypt(value) : value

  await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value: finalValue,
      isEncrypted: shouldEncrypt,
      description,
      updatedAt: new Date(),
    },
    create: {
      key,
      value: finalValue,
      category,
      isEncrypted: shouldEncrypt,
      description,
    },
  })
}

/**
 * Récupère toutes les configs d'une catégorie
 */
export async function getConfigsByCategory(
  category: ConfigCategory
): Promise<Array<{ key: string; value: string | null; description: string | null }>> {
  const configs = await prisma.systemConfig.findMany({
    where: { category },
  })

  return configs.map(config => ({
    key: config.key,
    value: config.value && config.isEncrypted
      ? decrypt(config.value)
      : config.value,
    description: config.description,
  }))
}

/**
 * Supprime une configuration
 */
export async function deleteConfig(key: string): Promise<void> {
  await prisma.systemConfig.delete({
    where: { key },
  })
}

// ============================================
// Helpers pour configurations courantes
// ============================================

/**
 * Configuration Stripe
 */
export const stripeConfig = {
  async getSecretKey(): Promise<string | null> {
    return getConfig('stripe.secret_key')
  },

  async setSecretKey(key: string): Promise<void> {
    return setConfig(
      'stripe.secret_key',
      key,
      'STRIPE',
      'Stripe Secret Key',
      true
    )
  },

  async getPublishableKey(): Promise<string | null> {
    return getConfig('stripe.publishable_key')
  },

  async setPublishableKey(key: string): Promise<void> {
    return setConfig(
      'stripe.publishable_key',
      key,
      'STRIPE',
      'Stripe Publishable Key',
      false
    )
  },

  async getWebhookSecret(): Promise<string | null> {
    return getConfig('stripe.webhook_secret')
  },

  async setWebhookSecret(secret: string): Promise<void> {
    return setConfig(
      'stripe.webhook_secret',
      secret,
      'STRIPE',
      'Stripe Webhook Secret',
      true
    )
  },
}

/**
 * Configuration Dropcontact
 */
export const dropcontactConfig = {
  async getApiKey(): Promise<string | null> {
    return getConfig('dropcontact.api_key')
  },

  async setApiKey(key: string): Promise<void> {
    return setConfig(
      'dropcontact.api_key',
      key,
      'API',
      'Dropcontact API Key',
      true
    )
  },
}

/**
 * Configuration des plans
 */
export const planConfig = {
  async getCreditsPerResult(): Promise<number> {
    const value = await getConfig('billing.credits_per_result')
    return value ? parseInt(value) : 10
  },

  async setCreditsPerResult(credits: number): Promise<void> {
    return setConfig(
      'billing.credits_per_result',
      credits.toString(),
      'BILLING',
      'Crédits par ligne de résultat'
    )
  },
}
