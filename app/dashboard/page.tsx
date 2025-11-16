'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganization } from '@/hooks/use-organization'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TrendingUp, Search, Coins, Users, Download, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { organization } = useOrganization()
  const [stats, setStats] = useState({
    totalSearches: 0,
    thisMonth: 0,
    creditsUsed: 0,
    teamMembers: 1,
    recentSearches: [],
  })

  useEffect(() => {
    // TODO: Fetch real stats from API
    // For now, using mock data
    setStats({
      totalSearches: 12,
      thisMonth: 5,
      creditsUsed: 847,
      teamMembers: 1,
      recentSearches: [],
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crédits disponibles
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization?.creditBalance.toLocaleString('fr-FR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Plan {organization?.plan}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recherches ce mois
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisMonth - 2} vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crédits utilisés
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.creditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              Total depuis le début
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Membres de l'équipe
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {organization?.role === 'OWNER' ? 'Vous êtes propriétaire' : 'Membre'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Lancez une nouvelle recherche ou gérez vos crédits
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button asChild className="h-20 flex-col gap-2">
            <Link href="/dashboard/search">
              <Search className="h-6 w-6" />
              <span>Nouvelle recherche</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-20 flex-col gap-2">
            <Link href="/dashboard/history">
              <Download className="h-6 w-6" />
              <span>Historique</span>
            </Link>
          </Button>

          {organization?.plan !== 'PRO' && organization?.plan !== 'ENTERPRISE' && (
            <Button asChild variant="secondary" className="h-20 flex-col gap-2">
              <Link href="/pricing">
                <Sparkles className="h-6 w-6" />
                <span>Passer au Pro</span>
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Vos dernières recherches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentSearches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aucune recherche effectuée
              </p>
              <Button asChild>
                <Link href="/dashboard/search">
                  Lancer ma première recherche
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODO: Map actual searches */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
