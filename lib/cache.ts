import { Redis } from 'ioredis'
import { logger } from './logger'

/**
 * 🚀 CACHE REDIS - Performance Optimization
 *
 * Cache intelligent pour requêtes fréquentes:
 * - getUserOrganization (très sollicité)
 * - User data
 * - Organization data
 *
 * TTL adaptatifs selon type de donnée
 */

let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (redis) return redis

  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured, caching disabled')
    return null
  }

  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true,
    })

    redis.on('error', (error) => {
      logger.error({ error, component: 'redis' }, 'Redis connection error')
    })

    redis.on('connect', () => {
      logger.info({ component: 'redis' }, 'Redis connected successfully')
    })

    return redis
  } catch (error) {
    logger.error({ error, component: 'redis' }, 'Failed to initialize Redis')
    return null
  }
}

/**
 * Cache TTLs (en secondes)
 */
const CACHE_TTL = {
  USER_ORG: 300, // 5 minutes (très sollicité)
  USER: 600, // 10 minutes
  ORGANIZATION: 300, // 5 minutes
  CREDITS: 60, // 1 minute (change souvent)
  SEARCH: 1800, // 30 minutes (statique une fois créé)
} as const

/**
 * Get from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const cached = await client.get(key)
    if (!cached) return null

    return JSON.parse(cached) as T
  } catch (error) {
    logger.warn({ error, key, component: 'cache' }, 'Cache get failed')
    return null
  }
}

/**
 * Set in cache
 */
export async function cacheSet(
  key: string,
  value: any,
  ttl: number
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    logger.warn({ error, key, component: 'cache' }, 'Cache set failed')
  }
}

/**
 * Delete from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.del(key)
  } catch (error) {
    logger.warn({ error, key, component: 'cache' }, 'Cache delete failed')
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
    }
  } catch (error) {
    logger.warn({ error, pattern, component: 'cache' }, 'Cache pattern delete failed')
  }
}

/**
 * Helper: Cache wrapper pour fonctions
 * Utilise le cache si disponible, sinon exécute la fonction
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key)
  if (cached !== null) {
    logger.debug({ key, component: 'cache' }, 'Cache hit')
    return cached
  }

  // Execute function
  logger.debug({ key, component: 'cache' }, 'Cache miss')
  const result = await fn()

  // Store in cache
  await cacheSet(key, result, ttl)

  return result
}

/**
 * Cache keys generators (pour cohérence)
 */
export const CacheKeys = {
  userOrganization: (userId: string) => `user:${userId}:organization`,
  user: (userId: string) => `user:${userId}`,
  organization: (orgId: string) => `org:${orgId}`,
  organizationCredits: (orgId: string) => `org:${orgId}:credits`,
  search: (searchId: string) => `search:${searchId}`,
  userPattern: (userId: string) => `user:${userId}:*`,
  orgPattern: (orgId: string) => `org:${orgId}:*`,
}

/**
 * ✅ PERFORMANCE: Invalider cache utilisateur (lors update)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheDeletePattern(CacheKeys.userPattern(userId))
  logger.debug({ userId, component: 'cache' }, 'User cache invalidated')
}

/**
 * ✅ PERFORMANCE: Invalider cache organisation (lors update)
 */
export async function invalidateOrganizationCache(
  organizationId: string
): Promise<void> {
  await cacheDeletePattern(CacheKeys.orgPattern(organizationId))
  logger.debug({ organizationId, component: 'cache' }, 'Organization cache invalidated')
}

export { CACHE_TTL }
