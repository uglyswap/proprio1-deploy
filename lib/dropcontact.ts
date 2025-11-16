interface DropcontactInput {
  first_name: string
  last_name: string
  company?: string
  website?: string
  email?: string
  phone?: string
}

interface DropcontactResult {
  email: string | null
  email_verified: boolean
  phone: string | null
  mobile_phone: string | null
  linkedin: string | null
  company: string | null
  job_title: string | null
  confidence: number
}

/**
 * Enrich contact data using Dropcontact API
 */
export async function enrichWithDropcontact(
  input: DropcontactInput
): Promise<DropcontactResult> {
  if (!process.env.DROPCONTACT_API_KEY) {
    throw new Error('DROPCONTACT_API_KEY is not configured')
  }

  try {
    // Step 1: Submit batch request
    const submitResponse = await fetch('https://api.dropcontact.io/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': process.env.DROPCONTACT_API_KEY
      },
      body: JSON.stringify({
        data: [input],
        siren: true,
        language: 'fr'
      })
    })

    if (!submitResponse.ok) {
      throw new Error(`Dropcontact API error: ${submitResponse.statusText}`)
    }

    const submitData = await submitResponse.json()
    const requestId = submitData.request_id

    // Step 2: Poll for results (max 30 seconds)
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const resultResponse = await fetch(
        `https://api.dropcontact.io/batch/${requestId}`,
        {
          headers: {
            'X-Access-Token': process.env.DROPCONTACT_API_KEY
          }
        }
      )

      if (!resultResponse.ok) {
        throw new Error(`Dropcontact result error: ${resultResponse.statusText}`)
      }

      const resultData = await resultResponse.json()

      if (resultData.success && resultData.data?.[0]) {
        const result = resultData.data[0]

        return {
          email: result.email?.[0]?.email || null,
          email_verified: result.email?.[0]?.email_status === 'valid',
          phone: result.phone || null,
          mobile_phone: result.mobile_phone || null,
          linkedin: result.linkedin || null,
          company: result.company || null,
          job_title: result.job || null,
          confidence: result.email?.[0]?.qualification || 0
        }
      }

      attempts++
    }

    throw new Error('Dropcontact enrichment timeout')

  } catch (error) {
    console.error('Dropcontact error:', error)
    throw error
  }
}

/**
 * Parse proprietaire name from French cadastre format
 * Examples:
 * - "DUPONT Jean" → { firstName: "Jean", lastName: "DUPONT" }
 * - "M. MARTIN Pierre" → { firstName: "Pierre", lastName: "MARTIN" }
 * - "SCI LES OLIVIERS" → { firstName: "", lastName: "SCI LES OLIVIERS" }
 */
export function parseProprietaireName(proprietaire: string): {
  firstName: string
  lastName: string
} {
  const cleaned = proprietaire
    .replace(/^(M\.|Mme|Mlle|Mr)\s*/i, '')
    .trim()

  const parts = cleaned.split(' ')

  if (parts.length >= 2) {
    // Nom en premier (format français cadastre)
    return {
      firstName: parts.slice(1).join(' '),
      lastName: parts[0]
    }
  }

  return {
    firstName: '',
    lastName: cleaned
  }
}
