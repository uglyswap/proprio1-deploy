'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/hooks/use-organization'
import { Coins, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface CreditTransaction {
  id: string
  amount: number
  type: string
  description: string | null
  createdAt: string
}

export default function CreditsPage() {
  const { organization } = useOrganization()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    try {
      const res = await fetch('/api/credits/transactions')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function getTypeIcon(type: string) {
    if (type === 'SEARCH_COST' || type === 'ENRICHMENT_COST') {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <TrendingUp className="h-4 w-4 text-green-600" />
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      PURCHASE: 'Achat',
      SUBSCRIPTION: 'Abonnement',
      SEARCH_COST: 'Recherche',
      ENRICHMENT_COST: 'Enrichissement',
      REFUND: 'Remboursement',
      ADJUSTMENT: 'Ajustement',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des crédits</h1>
        <p className="text-muted-foreground">
          Consultez votre solde et l'historique de vos crédits
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crédits disponibles
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {organization?.creditBalance.toLocaleString('fr-FR')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Plan {organization?.plan}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crédits utilisés ce mois
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {/* TODO: Calculate from transactions */}
              247
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sur 30 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Moyenne journalière
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {/* TODO: Calculate from transactions */}
              8
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Crédits par jour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acheter des crédits</CardTitle>
          <CardDescription>
            Ajoutez des crédits à votre solde ou passez à un plan supérieur
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link href="/pricing">
              <Plus className="h-4 w-4 mr-2" />
              Voir les plans
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            Toutes les opérations sur vos crédits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aucune transaction
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={transaction.amount > 0 ? 'default' : 'secondary'}
                        className={transaction.amount > 0 ? 'bg-green-600' : ''}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString('fr-FR')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
