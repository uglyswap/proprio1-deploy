import { Redis } from 'ioredis'
import { logger } from './logger'

/**
 * 🛡️ RATE LIMITING - Protection anti-abus
 *
 * Rate limiter basé sur Redis (sliding window)
 * Protège contre spam et DoS
 */

let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (redis) return redis

  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured, rate limiting disabled')
    return null
  }

  try {
    redis = new Redis(process.env.REDIS_URL)
    return redis
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Redis for rate limiting')
    return null
  }
}

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict
  AUTH_REGISTER: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 par 15 min
  AUTH_LOGIN: { max: 10, windowMs: 15 * 60 * 1000 }, // 10 par 15 min

  // API endpoints - modéré
  API_SEARCH: { max: 100, windowMs: 60 * 1000 }, // 100 par minute
  API_STRIPE: { max: 20, windowMs: 60 * 1000 }, // 20 par minute

  // General API - large
  API_GENERAL: { max: 300, windowMs: 60 * 1000 }, // 300 par minute
} as const

export type RateLimitKey = keyof typeof RATE_LIMITS

/**
 * Check if request is rate limited
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string, // IP ou userId
  limitKey: RateLimitKey
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const client = getRedisClient()

  // Si Redis pas dispo, autoriser (fail open)
  if (!client) {
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 60000),
    }
  }

  const config = RATE_LIMITS[limitKey]
  const key = `ratelimit:${limitKey}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    // Utilise Redis sorted set pour sliding window
    const multi = client.multi()

    // Supprime les anciennes entrées
    multi.zremrangebyscore(key, 0, windowStart)

    // Compte les requêtes dans la fenêtre
    multi.zcard(key)

    // Ajoute la requête actuelle
    multi.zadd(key, now, `${now}`)

    // Expire la clé après la fenêtre
    multi.expire(key, Math.ceil(config.windowMs / 1000))

    const results = await multi.exec()

    if (!results) {
      throw new Error('Redis multi command failed')
    }

    // results[1] contient le count avant l'ajout
    const currentCount = (results[1][1] as number) || 0
    const allowed = currentCount < config.max
    const remaining = Math.max(0, config.max - currentCount - 1)
    const resetAt = new Date(now + config.windowMs)

    if (!allowed) {
      logger.warn(
        {
          identifier,
          limitKey,
          currentCount,
          max: config.max,
        },
        'Rate limit exceeded'
      )
    }

    return { allowed, remaining, resetAt }
  } catch (error) {
    logger.error({ error, identifier, limitKey }, 'Rate limit check failed')

    // En cas d'erreur, autoriser (fail open)
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 60000),
    }
  }
}

/**
 * Helper middleware pour Next.js API routes
 */
export async function withRateLimit(
  req: Request,
  limitKey: RateLimitKey,
  getUserId?: () => Promise<string | null>
): Promise<
  | { allowed: true; remaining: number; resetAt: Date }
  | { allowed: false; error: string; resetAt: Date }
> {
  // Utilise userId si connecté, sinon IP
  let identifier: string

  if (getUserId) {
    const userId = await getUserId()
    identifier = userId || getClientIp(req) || 'anonymous'
  } else {
    identifier = getClientIp(req) || 'anonymous'
  }

  const result = await checkRateLimit(identifier, limitKey)

  if (!result.allowed) {
    return {
      allowed: false,
      error: 'Trop de requêtes. Veuillez réessayer plus tard.',
      resetAt: result.resetAt,
    }
  }

  return result
}

/**
 * Extract client IP from request
 */
function getClientIp(req: Request): string | null {
  // Vérifier les headers de proxy (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return null
}
