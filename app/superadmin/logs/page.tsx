import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSuperAdminUser } from '@/lib/super-admin'
import { prisma } from '@/lib/prisma'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  User,
  Search,
  CreditCard,
  Settings,
  Database,
  LogIn,
  LogOut,
} from 'lucide-react'

const actionIcons: Record<string, any> = {
  CREATE: Activity,
  UPDATE: Settings,
  DELETE: Activity,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  SEARCH: Search,
  EXPORT: Activity,
  CONFIG_CHANGE: Settings,
  CREDIT_CHANGE: CreditCard,
  SUBSCRIPTION_CHANGE: CreditCard,
  IMPERSONATE: User,
  API_CALL: Activity,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  SEARCH: 'bg-purple-100 text-purple-800',
  EXPORT: 'bg-blue-100 text-blue-800',
  CONFIG_CHANGE: 'bg-orange-100 text-orange-800',
  CREDIT_CHANGE: 'bg-yellow-100 text-yellow-800',
  SUBSCRIPTION_CHANGE: 'bg-indigo-100 text-indigo-800',
  IMPERSONATE: 'bg-red-100 text-red-800',
  API_CALL: 'bg-gray-100 text-gray-800',
}

async function LogsContent() {
  const user = await getSuperAdminUser()

  if (!user) {
    redirect('/dashboard')
  }

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Logs d'Audit
        </h1>
        <p className="text-gray-600 mt-1">
          Traçabilité complète de toutes les actions sur le système
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="px-4 py-2 border rounded-lg">
          <option value="">Toutes les actions</option>
          <option value="LOGIN">Connexions</option>
          <option value="SEARCH">Recherches</option>
          <option value="CONFIG_CHANGE">Modifications config</option>
          <option value="IMPERSONATE">Impersonations</option>
          <option value="CREDIT_CHANGE">Changements crédits</option>
        </select>

        <select className="px-4 py-2 border rounded-lg">
          <option value="">Toutes les entités</option>
          <option value="User">Utilisateurs</option>
          <option value="Organization">Organisations</option>
          <option value="Search">Recherches</option>
          <option value="SystemConfig">Configuration</option>
        </select>

        <input
          type="date"
          className="px-4 py-2 border rounded-lg"
          placeholder="Date"
        />
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des actions ({logs.length})</CardTitle>
          <CardDescription>
            Les 100 dernières actions enregistrées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const Icon = actionIcons[log.action] || Activity

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action]}>
                        <Icon className="h-3 w-3 mr-1" />
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <div className="font-medium text-sm">{log.user.name}</div>
                          <div className="text-xs text-gray-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Système</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.entity && (
                        <div className="text-sm">
                          <div className="font-medium">{log.entity}</div>
                          {log.entityId && (
                            <div className="text-xs text-gray-500 font-mono">
                              {log.entityId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm">
                      {log.description || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">
                      {log.ipAddress || '—'}
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

export default function SuperAdminLogsPage() {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<div className="p-8">Chargement...</div>}>
        <LogsContent />
      </Suspense>
    </SuperAdminLayout>
  )
}
