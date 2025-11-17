import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSuperAdminUser } from '@/lib/super-admin'
import { prisma } from '@/lib/prisma'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsChart, MultiLineChart } from '@/components/analytics-chart'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, CreditCard } from 'lucide-react'

async function AnalyticsContent() {
  const user = await getSuperAdminUser()

  if (!user) {
    redirect('/dashboard')
  }

  // Récupérer les métriques des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const dailyMetrics = await prisma.dailyMetrics.findMany({
    where: {
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: 'asc' },
  })

  // Préparer les données pour les graphiques
  const chartData = dailyMetrics.map((metric) => ({
    date: metric.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    mrr: Number(metric.mrr),
    customers: metric.totalCustomers,
    searches: metric.totalSearches,
    credits: metric.creditsConsumed,
    newCustomers: metric.newCustomers,
    churnedCustomers: metric.churnedCustomers,
    revenue: Number(metric.mrr),
    costs: Number(metric.apiCosts) + Number(metric.enrichmentCosts),
    profit: Number(metric.mrr) - Number(metric.apiCosts) - Number(metric.enrichmentCosts),
  }))

  // Calculs des totaux et moyennes
  const latestMetric = dailyMetrics[dailyMetrics.length - 1]
  const previousMetric = dailyMetrics[dailyMetrics.length - 8] // 7 jours avant

  const mrrGrowth = previousMetric
    ? ((Number(latestMetric?.mrr || 0) - Number(previousMetric.mrr)) / Number(previousMetric.mrr)) * 100
    : 0

  const customerGrowth = previousMetric
    ? ((latestMetric?.totalCustomers || 0) - previousMetric.totalCustomers) / previousMetric.totalCustomers * 100
    : 0

  const totalSearches = dailyMetrics.reduce((sum, m) => sum + m.totalSearches, 0)
  const totalCredits = dailyMetrics.reduce((sum, m) => sum + m.creditsConsumed, 0)

  const stats = [
    {
      name: 'MRR',
      value: formatCurrency(Number(latestMetric?.mrr || 0)),
      change: mrrGrowth,
      trend: mrrGrowth >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Clients',
      value: formatNumber(latestMetric?.totalCustomers || 0),
      change: customerGrowth,
      trend: customerGrowth >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Recherches (30j)',
      value: formatNumber(totalSearches),
      change: 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Crédits (30j)',
      value: formatNumber(totalCredits),
      change: 0,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics & Business Intelligence
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Vue complète de vos métriques SaaS sur 30 jours
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
              {stat.change !== 0 && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(stat.change).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs. semaine dernière</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <MultiLineChart
        title="Revenue, Coûts & Profit"
        description="Évolution financière sur 30 jours"
        data={chartData}
        lines={[
          { dataKey: 'revenue', color: '#10b981', name: 'Revenue (MRR)' },
          { dataKey: 'costs', color: '#ef4444', name: 'Coûts API' },
          { dataKey: 'profit', color: '#3b82f6', name: 'Profit' },
        ]}
      />

      {/* Customers Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsChart
          title="Évolution Clients"
          description="Nombre total de clients actifs"
          data={chartData}
          dataKey="customers"
          type="area"
          color="#3b82f6"
        />

        <AnalyticsChart
          title="Nouveaux Clients vs Churn"
          description="Acquisition et perte de clients"
          data={chartData}
          dataKey="newCustomers"
          type="bar"
          color="#10b981"
        />
      </div>

      {/* Usage Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsChart
          title="Recherches par jour"
          description="Volume d'utilisation du service"
          data={chartData}
          dataKey="searches"
          type="bar"
          color="#8b5cf6"
        />

        <AnalyticsChart
          title="Crédits consommés"
          description="Utilisation des crédits par jour"
          data={chartData}
          dataKey="credits"
          type="area"
          color="#f59e0b"
        />
      </div>

      {/* Key Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques Clés (30 jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600">ARR</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(latestMetric?.mrr || 0) * 12)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Nouveaux clients</div>
              <div className="text-2xl font-bold text-blue-600">
                {dailyMetrics.reduce((sum, m) => sum + m.newCustomers, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Churn</div>
              <div className="text-2xl font-bold text-red-600">
                {dailyMetrics.reduce((sum, m) => sum + m.churnedCustomers, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Coûts API</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  dailyMetrics.reduce((sum, m) => sum + Number(m.apiCosts) + Number(m.enrichmentCosts), 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuperAdminAnalyticsPage() {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<div className="p-8">Chargement des analytics...</div>}>
        <AnalyticsContent />
      </Suspense>
    </SuperAdminLayout>
  )
}
