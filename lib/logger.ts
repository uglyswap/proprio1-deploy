import pino from 'pino'

/**
 * 📊 LOGGING STRUCTURÉ - Production Ready
 *
 * Utilise Pino (6x plus rapide que Winston)
 * - Logs JSON en production pour parsing facile
 * - Logs pretty en développement pour lisibilité
 * - Contexte automatique avec timestamp, PID, hostname
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print en dev, JSON en prod
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Formatters pour ajout de contexte
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },

  // Base context (ajouté à tous les logs)
  base: {
    env: process.env.NODE_ENV || 'development',
  },
})

/**
 * Logger spécifique pour les routes API
 * Ajoute automatiquement le contexte HTTP
 */
export function apiLogger(route: string) {
  return logger.child({ component: 'api', route })
}

/**
 * Logger pour les webhooks
 */
export function webhookLogger(provider: string) {
  return logger.child({ component: 'webhook', provider })
}

/**
 * Logger pour les jobs async (BullMQ)
 */
export function jobLogger(jobName: string) {
  return logger.child({ component: 'job', jobName })
}

/**
 * Logger pour les erreurs Prisma
 */
export function dbLogger() {
  return logger.child({ component: 'database' })
}

/**
 * Helper pour logger les erreurs avec contexte complet
 */
export function logError(
  error: Error | unknown,
  context: {
    component: string
    action: string
    userId?: string
    organizationId?: string
    metadata?: Record<string, any>
  }
) {
  const errorObj = error instanceof Error ? error : new Error(String(error))

  logger.error(
    {
      ...context,
      error: {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
      },
    },
    `Error in ${context.component}.${context.action}`
  )
}

/**
 * Helper pour logger les succès importants
 */
export function logSuccess(
  message: string,
  context: {
    component: string
    action: string
    userId?: string
    organizationId?: string
    metadata?: Record<string, any>
  }
) {
  logger.info(context, message)
}

/**
 * Helper pour logger les métriques de performance
 */
export function logPerformance(
  action: string,
  durationMs: number,
  metadata?: Record<string, any>
) {
  logger.info(
    {
      component: 'performance',
      action,
      durationMs,
      ...metadata,
    },
    `Performance: ${action} took ${durationMs}ms`
  )
}
