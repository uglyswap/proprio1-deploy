import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSuperAdminUser } from '@/lib/super-admin'
import { prisma } from '@/lib/prisma'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  ExternalLink,
  Search,
  TrendingUp,
  Users,
  CreditCard,
} from 'lucide-react'

async function ClientsContent() {
  const user = await getSuperAdminUser()

  if (!user) {
    redirect('/dashboard')
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        include: { user: true },
      },
      _count: {
        select: {
          searches: true,
          users: true,
        },
      },
    },
  })

  const planColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-800',
    BASIC: 'bg-blue-100 text-blue-800',
    PRO: 'bg-purple-100 text-purple-800',
    ENTERPRISE: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Clients
          </h1>
          <p className="text-gray-600 mt-1">
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
              />
            </div>
            <select className="px-4 py-2 border rounded-lg">
              <option value="">Tous les plans</option>
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
            <select className="px-4 py-2 border rounded-lg">
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            Gérez vos clients, visualisez leurs stats et impersonnez-les
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {organizations.map((org) => {
                const owner = org.users.find(u => u.role === 'OWNER')

                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-gray-500">
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
                        <span className="font-medium">{org.creditBalance}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Search className="h-4 w-4 text-gray-400" />
                        <span>{org._count.searches}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{org._count.users}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(org.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/superadmin/clients/${org.id}`}>
                          <Button size="sm" variant="outline">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form action={`/api/superadmin/impersonate`} method="POST">
                          <input type="hidden" name="organizationId" value={org.id} />
                          <Button size="sm" variant="outline" type="submit">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuperAdminClientsPage() {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<div className="p-8">Chargement...</div>}>
        <ClientsContent />
      </Suspense>
    </SuperAdminLayout>
  )
}
