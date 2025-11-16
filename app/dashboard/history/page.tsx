'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Search, MapPin, User, Sparkles, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SearchHistory {
  id: string
  type: 'BY_ADDRESS' | 'BY_OWNER' | 'BY_ZONE'
  status: 'ESTIMATED' | 'VALIDATED' | 'COMPLETED' | 'ENRICHED'
  actualRows: number | null
  actualCost: number | null
  createdAt: string
  enrichedAt: string | null
}

export default function HistoryPage() {
  const [searches, setSearches] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [enrichingSearchId, setEnrichingSearchId] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      const res = await fetch('/api/search/history')
      if (res.ok) {
        const data = await res.json()
        setSearches(data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEnrich(searchId: string) {
    setEnrichingSearchId(searchId)

    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      })

      if (res.ok) {
        // Refresh history
        fetchHistory()
      }
    } catch (error) {
      console.error('Enrichment error:', error)
    } finally {
      setEnrichingSearchId(null)
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'BY_ADDRESS':
        return <MapPin className="h-4 w-4" />
      case 'BY_OWNER':
        return <User className="h-4 w-4" />
      case 'BY_ZONE':
        return <Search className="h-4 w-4" />
      default:
        return null
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'BY_ADDRESS':
        return 'Par adresse'
      case 'BY_OWNER':
        return 'Par propriétaire'
      case 'BY_ZONE':
        return 'Par zone'
      default:
        return type
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'ESTIMATED':
        return <Badge variant="secondary">Estimée</Badge>
      case 'VALIDATED':
        return <Badge variant="secondary">Validée</Badge>
      case 'COMPLETED':
        return <Badge>Terminée</Badge>
      case 'ENRICHED':
        return <Badge className="bg-green-600">Enrichie</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historique des recherches</h1>
        <p className="text-muted-foreground">
          Consultez toutes vos recherches passées
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mes recherches</CardTitle>
          <CardDescription>
            {searches.length} recherche(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searches.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucune recherche effectuée
              </p>
              <Button asChild>
                <a href="/dashboard/search">Lancer ma première recherche</a>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Résultats</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searches.map((search) => (
                  <TableRow key={search.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(search.type)}
                        <span className="text-sm">
                          {getTypeLabel(search.type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(search.createdAt)}
                    </TableCell>
                    <TableCell>
                      {search.actualRows?.toLocaleString('fr-FR') || '-'}
                    </TableCell>
                    <TableCell>
                      {search.actualCost?.toLocaleString('fr-FR') || '-'} crédits
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(search.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {search.status === 'COMPLETED' || search.status === 'ENRICHED' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a href={`/api/search/download/${search.id}`}>
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                              </a>
                            </Button>

                            {search.status === 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEnrich(search.id)}
                                disabled={enrichingSearchId === search.id}
                              >
                                {enrichingSearchId === search.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Enrichir
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
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
