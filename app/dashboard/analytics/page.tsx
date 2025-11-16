import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, getUserOrganization } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsChart } from '@/components/analytics-chart'
import { formatNumber } from '@/lib/utils'
import {
  Activity,
  Search,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  MapPin,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

async function AnalyticsContent() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const organization = await getUserOrganization(session.user.id)

  if (!organization) {
    redirect('/dashboard')
  }

  // Périodes pour comparaison
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  // Recherches période actuelle (30 derniers jours)
  const searches = await prisma.search.findMany({
    where: {
      organizationId: organization.id,
      createdAt: { gte: thirtyDaysAgo },
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'asc' },
  })

  // Recherches période précédente (30 jours avant)
  const searchesPrevious = await prisma.search.findMany({
    where: {
      organizationId: organization.id,
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
      status: 'COMPLETED',
    },
  })

  // Transactions de crédits période actuelle
  const transactions = await prisma.creditTransaction.findMany({
    where: {
      organizationId: organization.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Transactions période précédente
  const transactionsPrevious = await prisma.creditTransaction.findMany({
    where: {
      organizationId: organization.id,
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
  })

  // Calcul stats période actuelle
  const totalSearches = searches.length
  const totalResults = searches.reduce((sum, s) => sum + (s.actualRows || 0), 0)
  const totalCreditsUsed = searches.reduce((sum, s) => sum + (s.actualCost || 0), 0)
  const creditsAdded = transactions
    .filter((t) => t.type === 'SUBSCRIPTION' || t.type === 'PURCHASE')
    .reduce((sum, t) => sum + t.amount, 0)

  // Calcul stats période précédente
  const totalSearchesPrev = searchesPrevious.length
  const totalResultsPrev = searchesPrevious.reduce((sum, s) => sum + (s.actualRows || 0), 0)
  const totalCreditsUsedPrev = searchesPrevious.reduce((sum, s) => sum + (s.actualCost || 0), 0)
  const creditsAddedPrev = transactionsPrevious
    .filter((t) => t.type === 'SUBSCRIPTION' || t.type === 'PURCHASE')
    .reduce((sum, t) => sum + t.amount, 0)

  // Calcul des variations en pourcentage
  const searchesChange = totalSearchesPrev > 0 ? ((totalSearches - totalSearchesPrev) / totalSearchesPrev) * 100 : 0
  const resultsChange = totalResultsPrev > 0 ? ((totalResults - totalResultsPrev) / totalResultsPrev) * 100 : 0
  const creditsUsedChange = totalCreditsUsedPrev > 0 ? ((totalCreditsUsed - totalCreditsUsedPrev) / totalCreditsUsedPrev) * 100 : 0
  const creditsAddedChange = creditsAddedPrev > 0 ? ((creditsAdded - creditsAddedPrev) / creditsAddedPrev) * 100 : 0

  // Stats avancées
  const avgResultsPerSearch = totalSearches > 0 ? totalResults / totalSearches : 0
  const avgCreditsPerSearch = totalSearches > 0 ? totalCreditsUsed / totalSearches : 0
  const avgCostPerResult = totalResults > 0 ? totalCreditsUsed / totalResults : 0
  const conversionRate = creditsAdded > 0 ? (totalCreditsUsed / creditsAdded) * 100 : 0

  // Prix unitaire crédit (estimation basée sur plan moyen)
  const avgCreditPrice = 0.05 // ~5 centimes par crédit (moyenne des plans)
  const totalRevenue = creditsAdded * avgCreditPrice
  const revenuePrevious = creditsAddedPrev * avgCreditPrice
  const revenueChange = revenuePrevious > 0 ? ((totalRevenue - revenuePrevious) / revenuePrevious) * 100 : 0

  // Répartition par type de recherche
  const searchesByType = searches.reduce(
    (acc, search) => {
      acc[search.type] = (acc[search.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Agréger par jour pour les graphiques
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
        revenue: 0,
      })
    }

    const data = dailyData.get(date)
    data.searches++
    data.results += search.actualRows || 0
    data.credits += search.actualCost || 0
    data.revenue += (search.actualCost || 0) * avgCreditPrice
  })

  const chartData = Array.from(dailyData.values())

  // Stats cards avec comparaison
  const stats = [
    {
      name: 'Revenue estimé',
      value: `${totalRevenue.toFixed(2)}€`,
      change: revenueChange,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      name: 'Recherches totales',
      value: formatNumber(totalSearches),
      change: searchesChange,
      icon: Search,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'Résultats obtenus',
      value: formatNumber(totalResults),
      change: resultsChange,
      icon: Activity,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      name: 'Crédits utilisés',
      value: formatNumber(totalCreditsUsed),
      change: creditsUsedChange,
      icon: CreditCard,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      name: 'Crédits ajoutés',
      value: formatNumber(creditsAdded),
      change: creditsAddedChange,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      name: 'Taux de conversion',
      value: `${conversionRate.toFixed(1)}%`,
      change: 0,
      icon: Target,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      name: 'Moy. résultats/recherche',
      value: avgResultsPerSearch.toFixed(1),
      change: 0,
      icon: BarChart3,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      name: 'Coût/résultat',
      value: `${avgCostPerResult.toFixed(1)} cr.`,
      change: 0,
      icon: MapPin,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble détaillée de votre utilisation sur 30 jours
        </p>
      </div>

      {/* Stats Grid - 4 colonnes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.change > 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        +{stat.change.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">
                        {stat.change.toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">vs 30j précédents</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Charts - 2 colonnes */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsChart
          title="Revenue quotidien"
          description="Estimation du revenu généré par jour"
          data={chartData}
          dataKey="revenue"
          type="area"
          color="#10b981"
        />

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
          description="Nombre de propriétaires trouvés par jour"
          data={chartData}
          dataKey="results"
          type="area"
          color="#6366f1"
        />

        <AnalyticsChart
          title="Consommation de crédits"
          description="Crédits utilisés par jour"
          data={chartData}
          dataKey="credits"
          type="bar"
          color="#f59e0b"
        />
      </div>

      <Separator />

      {/* Répartition par type de recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type de recherche</CardTitle>
          <CardDescription>Distribution de vos recherches par méthode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(searchesByType).map(([type, count]) => {
              const percentage = totalSearches > 0 ? ((count / totalSearches) * 100).toFixed(1) : 0
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {type === 'BY_ADDRESS' && <MapPin className="h-4 w-4 text-blue-600" />}
                      {type === 'BY_OWNER' && <Users className="h-4 w-4 text-purple-600" />}
                      {type === 'BY_ZONE' && <BarChart3 className="h-4 w-4 text-green-600" />}
                      <span className="font-medium">
                        {type === 'BY_ADDRESS' && 'Recherche par adresse'}
                        {type === 'BY_OWNER' && 'Recherche par propriétaire'}
                        {type === 'BY_ZONE' && 'Recherche géographique'}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {count} ({percentage}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        type === 'BY_ADDRESS' ? 'bg-blue-600' :
                        type === 'BY_OWNER' ? 'bg-purple-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
                className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/20 rounded-lg hover:bg-muted/70 dark:hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {search.type === 'BY_ADDRESS' && <MapPin className="h-4 w-4 text-blue-600" />}
                    {search.type === 'BY_OWNER' && <Users className="h-4 w-4 text-purple-600" />}
                    {search.type === 'BY_ZONE' && <BarChart3 className="h-4 w-4 text-green-600" />}
                    <span className="font-medium">
                      {search.type === 'BY_ADDRESS' && 'Recherche par adresse'}
                      {search.type === 'BY_OWNER' && 'Recherche par propriétaire'}
                      {search.type === 'BY_ZONE' && 'Recherche géographique'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(search.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    {formatNumber(search.actualRows || 0)} résultats
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(search.actualCost || 0)} crédits
                  </div>
                </div>
              </div>
            ))}
            {searches.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune recherche effectuée sur cette période
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardAnalyticsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Chargement des analytics...</div>}>
        <AnalyticsContent />
      </Suspense>
    </DashboardLayout>
  )
}
