import { Worker, Job } from 'bullmq'
import { prisma } from '../lib/prisma'
import { enrichWithDropcontact, parseProprietaireName } from '../lib/dropcontact'
import { deductCredits } from '../lib/credits'

interface EnrichmentJob {
  searchId: string
  organizationId: string
}

// ✅ IMPROVEMENT: Batch processing with concurrency (was sequential 1s per property)
const ENRICHMENT_CONCURRENCY = 3
const ENRICHMENT_RATE_LIMIT_MS = 1000 // 1 request per second per worker
const ENRICHMENT_COST_PER_CONTACT = parseFloat(process.env.ENRICHMENT_COST_PER_CONTACT || '0.02')

const worker = new Worker<EnrichmentJob>(
  'contact-enrichment',
  async (job: Job<EnrichmentJob>) => {
    const { searchId, organizationId } = job.data

    console.log(`Starting enrichment for search ${searchId}`)

    // Get all properties for this search
    const properties = await prisma.property.findMany({
      where: { searchId },
      select: {
        id: true,
        proprietaire: true,
        siren: true,
        companyName: true,
      },
    })

    let successCount = 0
    let failureCount = 0
    let totalCost = 0

    // ✅ FIX: Process properties in batches with controlled concurrency
    // instead of sequential 1s per property
    const batchSize = ENRICHMENT_CONCURRENCY
    const batches: typeof properties[] = []

    for (let i = 0; i < properties.length; i += batchSize) {
      batches.push(properties.slice(i, i + batchSize))
    }

    for (const [batchIndex, batch] of batches.entries()) {
      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (property) => {
          // Parse proprietaire name
          const { firstName, lastName } = parseProprietaireName(
            property.proprietaire
          )

          // Skip if no valid name (company without person)
          if (!lastName) {
            return { success: false, skipped: true }
          }

          // Enrich with Dropcontact
          const contactData = await enrichWithDropcontact({
            first_name: firstName,
            last_name: lastName,
            company: property.companyName || undefined,
          })

          // Update property with enriched data
          await prisma.property.update({
            where: { id: property.id },
            data: {
              email: contactData.email,
              emailVerified: contactData.email_verified,
              phone: contactData.phone,
              mobilePhone: contactData.mobile_phone,
              linkedin: contactData.linkedin,
              jobTitle: contactData.job_title,
              enrichedAt: new Date(),
              enrichmentConfidence: contactData.confidence,
            },
          })

          return { success: true, skipped: false }
        })
      )

      // Count results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.skipped) {
            failureCount++
          } else if (result.value.success) {
            successCount++
            totalCost += ENRICHMENT_COST_PER_CONTACT
          } else {
            failureCount++
          }
        } else {
          console.error('Property enrichment failed:', result.reason)
          failureCount++
        }
      }

      // Update job progress
      const processed = (batchIndex + 1) * batchSize
      const progress = Math.min((processed / properties.length) * 100, 100)
      await job.updateProgress(progress)

      // Rate limiting: wait between batches
      await new Promise((resolve) => setTimeout(resolve, ENRICHMENT_RATE_LIMIT_MS))
    }

    // Log enrichment
    await prisma.enrichmentLog.create({
      data: {
        searchId,
        organizationId,
        provider: 'dropcontact',
        successCount,
        failureCount,
        cost: totalCost,
      },
    })

    // Deduct enrichment cost from credits
    if (totalCost > 0) {
      const creditsToDeduct = Math.ceil(totalCost * 100) // Convert to credits
      await deductCredits(
        organizationId,
        creditsToDeduct,
        'ENRICHMENT_COST',
        `Dropcontact enrichment for ${successCount} contacts`,
        searchId
      )
    }

    // Update search status
    await prisma.search.update({
      where: { id: searchId },
      data: {
        status: 'ENRICHED',
        enrichedAt: new Date(),
      },
    })

    console.log(`Enrichment completed: ${successCount} success, ${failureCount} failures`)

    return {
      success: successCount,
      failed: failureCount,
      cost: totalCost,
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 1, // Process one job at a time to respect rate limits
    limiter: {
      max: 1,
      duration: 1000,
    },
  }
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed:`, job.returnvalue)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

console.log('Enrichment worker started')

export default worker
