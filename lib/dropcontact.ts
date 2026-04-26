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

    // Step 2: Poll for results (max 30 seconds with proper timeout)
    let attempts = 0
    const maxAttempts = 30
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000) // 35s global timeout

    try {
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const resultResponse = await fetch(
          `https://api.dropcontact.io/batch/${requestId}`,
          {
            headers: {
              'X-Access-Token': process.env.DROPCONTACT_API_KEY
            },
            signal: controller.signal,
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

      throw new Error('Dropcontact enrichment timeout after 30 seconds')
    } finally {
      clearTimeout(timeoutId)
    }

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
 * - "EARL DUPONT JEAN" → { firstName: "JEAN", lastName: "DUPONT" }
 * - "SASU MARIE DUPONT" → { firstName: "MARIE", lastName: "DUPONT" }
 */
export function parseProprietaireName(proprietaire: string): {
  firstName: string
  lastName: string
} {
  if (!proprietaire || proprietaire.trim().length === 0) {
    return { firstName: '', lastName: '' }
  }

  const cleaned = proprietaire
    .replace(/^(M\.|Mme|Mlle|Mr)\s*/i, '')
    .trim()

  if (cleaned.length === 0) {
    return { firstName: '', lastName: '' }
  }

  const parts = cleaned.split(' ')

  // Legal entity types that indicate a company
  const legalEntityTypes = ['SCI', 'SARL', 'SAS', 'SASU', 'EURL', 'SA', 'SNC', 'SEL', 'EARL', 'SCM', 'SCPI', 'GIE', 'SELARL', 'SELAS', 'SCP', 'GAEC', 'SCEA', 'ASSO', 'FOND', 'EPIC', 'EPA', 'EPCI', 'SEM', 'SPL', 'GIP', 'INDIV', 'COPRO', 'SYND', 'SCI']

  // Check if it's a company name (starts with legal entity type)
  const firstWord = parts[0]?.toUpperCase()
  if (legalEntityTypes.includes(firstWord)) {
    return {
      firstName: '',
      lastName: cleaned // Entire string is the company name
    }
  }

  // Check if ALL parts look like a company name (all uppercase, 3+ words)
  if (parts.length >= 3 && parts.every(p => p === p.toUpperCase() && p.length >= 2)) {
    // Likely a company name like "SCI LES OLIVIERS DU VAR"
    return {
      firstName: '',
      lastName: cleaned
    }
  }

  // Standard person name format: LASTNAME FirstName
  if (parts.length >= 2) {
    return {
      firstName: parts.slice(1).join(' '),
      lastName: parts[0]
    }
  }

  // Single word - could be either
  return {
    firstName: '',
    lastName: cleaned
  }
}
