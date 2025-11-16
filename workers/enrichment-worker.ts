import { Worker, Job } from 'bullmq'
import { prisma } from '../lib/prisma'
import { enrichWithDropcontact, parseProprietaireName } from '../lib/dropcontact'
import { deductCredits } from '../lib/credits'

interface EnrichmentJob {
  searchId: string
  organizationId: string
}

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

    for (const [index, property] of properties.entries()) {
      try {
        // Parse proprietaire name
        const { firstName, lastName } = parseProprietaireName(
          property.proprietaire
        )

        // Skip if no valid name
        if (!lastName) {
          failureCount++
          continue
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

        successCount++
        totalCost += 0.02 // 2 centimes per enrichment

        // Update job progress
        const progress = ((index + 1) / properties.length) * 100
        await job.updateProgress(progress)

        // Rate limiting: 1 request per second
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to enrich property ${property.id}:`, error)
        failureCount++
      }
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
