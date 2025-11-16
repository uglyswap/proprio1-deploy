import { z } from 'zod'

/**
 * Validation schemas for API routes
 * Protège contre les injections et payloads malveillants
 */

// Auth
export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(100),
  organizationName: z.string().min(2, 'Le nom d\'organisation doit contenir au moins 2 caractères').max(100),
})

export const signinSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

// Search
export const searchEstimateSchema = z.object({
  type: z.enum(['BY_ADDRESS', 'BY_OWNER', 'BY_ZONE']),
  criteria: z.record(z.any()), // JSON flexible mais typé
})

export const searchValidateSchema = z.object({
  searchId: z.string().cuid('ID de recherche invalide'),
})

export const searchExecuteSchema = z.object({
  searchId: z.string().cuid('ID de recherche invalide'),
})

// Stripe
export const stripeCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID requis').startsWith('price_', 'Price ID Stripe invalide'),
})

// Credits
export const creditTransactionSchema = z.object({
  organizationId: z.string().cuid('ID organisation invalide').optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
})

// Enrichment
export const enrichmentSchema = z.object({
  searchId: z.string().cuid('ID de recherche invalide'),
})

// Organization
export const organizationUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug invalide').optional(),
})

// Helper function to validate request body
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        success: false,
        error: firstError.message || 'Données invalides',
      }
    }
    return { success: false, error: 'Format de données invalide' }
  }
}
