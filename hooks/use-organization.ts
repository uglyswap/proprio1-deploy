import { useEffect, useState } from 'react'
import { useUser } from './use-user'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  creditBalance: number
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

export function useOrganization() {
  const { user, isLoading: userLoading } = useUser()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || userLoading) return

    async function fetchOrganization() {
      try {
        const res = await fetch('/api/organization/current')
        if (res.ok) {
          const data = await res.json()
          setOrganization(data)
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [user, userLoading])

  return {
    organization,
    isLoading,
    refreshOrganization: async () => {
      const res = await fetch('/api/organization/current')
      if (res.ok) {
        const data = await res.json()
        setOrganization(data)
      }
    },
  }
}
