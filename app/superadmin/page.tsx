import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSuperAdminUser, getBusinessMetrics } from '@/lib/super-admin'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CreditCard,
  Activity,
} from 'lucide-react'

async function DashboardContent() {
  const user = await getSuperAdminUser()

  if (!user) {
    redirect('/dashboard')
  }

  const metrics = await getBusinessMetrics()

  const stats = [
    {
      name: 'Clients Actifs',
      value: formatNumber(metrics.totalCustomers),
      change: `+${metrics.newCustomersThisMonth} ce mois`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'MRR',
      value: formatCurrency(metrics.mrr),
      change: `ARR: ${formatCurrency(metrics.arr)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Profit Mensuel',
      value: formatCurrency(metrics.profit),
      change: `Coûts API: ${formatCurrency(metrics.enrichmentCosts)}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      name: 'Recherches (30j)',
      value: formatNumber(metrics.searchesThisMonth),
      change: `${formatNumber(metrics.creditsConsumed)} crédits`,
      icon: Search,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Super Admin
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Vue d'ensemble de votre SaaS ProprioFinder
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Répartition par plan */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des clients par plan</CardTitle>
          <CardDescription>
            Nombre de clients et revenue par niveau d'abonnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.customersByPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.plan}</div>
                  <div className="text-sm text-gray-500">{item.count} clients</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(item.revenue)}/mois
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gérer les Clients
            </CardTitle>
            <CardDescription>
              Voir tous les clients, impersonation, analytics
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configuration Stripe
            </CardTitle>
            <CardDescription>
              Connecter votre compte Stripe facilement
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sources de Données
            </CardTitle>
            <CardDescription>
              Connecter vos bases PostgreSQL
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export default function SuperAdminPage() {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<div className="p-8">Chargement...</div>}>
        <DashboardContent />
      </Suspense>
    </SuperAdminLayout>
  )
}
