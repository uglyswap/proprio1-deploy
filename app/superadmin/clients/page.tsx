'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ExternalLink,
  Search,
  TrendingUp,
  Users,
  CreditCard,
  Loader2,
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  creditBalance: number
  isActive: boolean
  createdAt: string
  users: Array<{
    role: string
    user: {
      email: string
      name: string | null
    }
  }>
  _count: {
    searches: number
    users: number
  }
}

export default function SuperAdminClientsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/superadmin/organizations')
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async (organizationId: string) => {
    setImpersonating(organizationId)
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })

      if (res.ok) {
        const data = await res.json()
        // Redirect to dashboard as the client
        router.push(data.redirectUrl || '/dashboard')
      } else {
        alert('Failed to impersonate organization')
      }
    } catch (error) {
      console.error('Impersonation failed:', error)
      alert('Failed to impersonate organization')
    } finally {
      setImpersonating(null)
    }
  }

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.users.some(u => u.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesPlan = !filterPlan || org.plan === filterPlan
    return matchesSearch && matchesPlan
  })

  const planColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    ENTERPRISE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Clients
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {organizations.length} organisations • {organizations.filter(o => o.isActive).length} actives
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg"
                value={filterPlan}
                onChange={e => setFilterPlan(e.target.value)}
              >
                <option value="">Tous les plans</option>
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
            <CardDescription>
              Gérez vos clients, visualisez leurs stats et impersonnez-les en 1 clic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Crédits</TableHead>
                    <TableHead>Recherches</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => {
                    const owner = org.users.find(u => u.role === 'OWNER')

                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium dark:text-white">{org.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {owner?.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={planColors[org.plan] || planColors.FREE}>
                            {org.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="font-medium dark:text-white">{org.creditBalance}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="dark:text-white">{org._count.searches}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="dark:text-white">{org._count.users}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(org.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/superadmin/clients/${org.id}`}>
                              <Button size="sm" variant="outline">
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpersonate(org.id)}
                              disabled={impersonating === org.id}
                            >
                              {impersonating === org.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ExternalLink className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
