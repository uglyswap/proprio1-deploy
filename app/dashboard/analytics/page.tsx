import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, getUserOrganization } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsChart } from '@/components/analytics-chart'
import { formatNumber } from '@/lib/utils'
import { Activity, Search, CreditCard, TrendingUp } from 'lucide-react'

async function AnalyticsContent() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const organization = await getUserOrganization(session.user.id)

  if (!organization) {
    redirect('/dashboard')
  }

  // Recherches des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const searches = await prisma.search.findMany({
    where: {
      organizationId: organization.id,
      createdAt: { gte: thirtyDaysAgo },
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'asc' },
  })

  // Transactions de crédits
  const transactions = await prisma.creditTransaction.findMany({
    where: {
      organizationId: organization.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Agréger par jour
  const dailyData = new Map<string, any>()

  searches.forEach((search) => {
    const date = search.createdAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    })

    if (!dailyData.has(date)) {
      dailyData.set(date, {
        date,
        searches: 0,
        results: 0,
        credits: 0,
      })
    }

    const data = dailyData.get(date)
    data.searches++
    data.results += search.actualRows || 0
    data.credits += search.actualCost || 0
  })

  const chartData = Array.from(dailyData.values())

  // Stats totales
  const totalSearches = searches.length
  const totalResults = searches.reduce((sum, s) => sum + (s.actualRows || 0), 0)
  const totalCreditsUsed = searches.reduce((sum, s) => sum + (s.actualCost || 0), 0)
  const creditsAdded = transactions
    .filter((t) => t.type === 'SUBSCRIPTION' || t.type === 'PURCHASE')
    .reduce((sum, t) => sum + t.amount, 0)

  const stats = [
    {
      name: 'Recherches totales',
      value: formatNumber(totalSearches),
      icon: Search,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Résultats obtenus',
      value: formatNumber(totalResults),
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Crédits utilisés',
      value: formatNumber(totalCreditsUsed),
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Crédits ajoutés',
      value: formatNumber(creditsAdded),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de votre utilisation sur 30 jours
        </p>
      </div>

      {/* Stats */}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsChart
          title="Recherches par jour"
          description="Votre activité quotidienne"
          data={chartData}
          dataKey="searches"
          type="bar"
          color="#3b82f6"
        />

        <AnalyticsChart
          title="Résultats obtenus"
          description="Nombre de propriétaires trouvés"
          data={chartData}
          dataKey="results"
          type="area"
          color="#10b981"
        />
      </div>

      <AnalyticsChart
        title="Consommation de crédits"
        description="Crédits utilisés par jour"
        data={chartData}
        dataKey="credits"
        type="area"
        color="#f59e0b"
      />

      {/* Recent searches */}
      <Card>
        <CardHeader>
          <CardTitle>Recherches récentes</CardTitle>
          <CardDescription>Les 10 dernières recherches effectuées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {searches.slice(-10).reverse().map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {search.type === 'BY_ADDRESS' && 'Recherche par adresse'}
                    {search.type === 'BY_OWNER' && 'Recherche par propriétaire'}
                    {search.type === 'BY_ZONE' && 'Recherche géographique'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(search.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">
                    {formatNumber(search.actualRows || 0)} résultats
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatNumber(search.actualCost || 0)} crédits
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardAnalyticsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Chargement...</div>}>
        <AnalyticsContent />
      </Suspense>
    </DashboardLayout>
  )
}
