'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/hooks/use-organization'
import { Loader2, MapPin, User, Download, Info } from 'lucide-react'
import dynamic from 'next/dynamic'

// Import Leaflet dynamically (client-side only)
const MapSearch = dynamic(() => import('@/components/search/map-search'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">Chargement de la carte...</div>,
})

export default function SearchPage() {
  const { organization } = useOrganization()
  const [searchType, setSearchType] = useState<'address' | 'owner' | 'zone'>('address')
  const [formData, setFormData] = useState({
    adresse: '',
    codePostal: '',
    proprietaire: '',
    siren: '',
  })
  const [estimate, setEstimate] = useState<any>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleEstimate() {
    setIsEstimating(true)
    setError('')
    setEstimate(null)

    try {
      let criteria: any = {}

      if (searchType === 'address') {
        criteria = {
          adresse: formData.adresse,
          codePostal: formData.codePostal,
        }
      } else if (searchType === 'owner') {
        criteria = {
          proprietaire: formData.proprietaire,
          siren: formData.siren,
        }
      }

      const res = await fetch('/api/search/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: searchType === 'address' ? 'BY_ADDRESS' : searchType === 'owner' ? 'BY_OWNER' : 'BY_ZONE',
          criteria,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'estimation')
      }

      setEstimate(data)
      setSearchId(data.searchId)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsEstimating(false)
    }
  }

  async function handleValidateAndExecute() {
    if (!searchId) return

    setIsExecuting(true)
    setError('')

    try {
      // Step 1: Validate
      const validateRes = await fetch('/api/search/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      })

      if (!validateRes.ok) {
        const data = await validateRes.json()
        throw new Error(data.error || 'Erreur lors de la validation')
      }

      // Step 2: Execute
      const executeRes = await fetch('/api/search/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      })

      const data = await executeRes.json()

      if (!executeRes.ok) {
        throw new Error(data.error || 'Erreur lors de l\'exécution')
      }

      // Success - download results
      window.location.href = `/api/search/download/${searchId}`

      // Reset form
      setFormData({
        adresse: '',
        codePostal: '',
        proprietaire: '',
        siren: '',
      })
      setEstimate(null)
      setSearchId(null)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsExecuting(false)
    }
  }

  function handleZoneEstimate(polygon: number[][], estimatedCount: number) {
    setEstimate({
      estimatedRows: estimatedCount,
      estimatedCost: estimatedCount,
      currentBalance: organization?.creditBalance,
      remainingBalance: (organization?.creditBalance || 0) - estimatedCount,
      canProceed: (organization?.creditBalance || 0) >= estimatedCount,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouvelle recherche</h1>
        <p className="text-muted-foreground">
          Trouvez les propriétaires immobiliers en France
        </p>
      </div>

      <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="address">
            <MapPin className="h-4 w-4 mr-2" />
            Par adresse
          </TabsTrigger>
          <TabsTrigger value="owner">
            <User className="h-4 w-4 mr-2" />
            Par propriétaire
          </TabsTrigger>
          <TabsTrigger value="zone">
            <MapPin className="h-4 w-4 mr-2" />
            Par zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche par adresse</CardTitle>
              <CardDescription>
                Trouvez tous les propriétaires d'un bien à une adresse donnée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    placeholder="12 Rue de Rivoli"
                    value={formData.adresse}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codePostal">Code postal</Label>
                  <Input
                    id="codePostal"
                    placeholder="75001"
                    value={formData.codePostal}
                    onChange={(e) =>
                      setFormData({ ...formData, codePostal: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleEstimate}
                disabled={isEstimating || !formData.adresse}
              >
                {isEstimating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estimation...
                  </>
                ) : (
                  'Estimer le coût'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche par propriétaire</CardTitle>
              <CardDescription>
                Trouvez toutes les propriétés d'un propriétaire spécifique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proprietaire">Nom du propriétaire</Label>
                  <Input
                    id="proprietaire"
                    placeholder="DUPONT Jean"
                    value={formData.proprietaire}
                    onChange={(e) =>
                      setFormData({ ...formData, proprietaire: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siren">SIREN (optionnel)</Label>
                  <Input
                    id="siren"
                    placeholder="123456789"
                    value={formData.siren}
                    onChange={(e) =>
                      setFormData({ ...formData, siren: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleEstimate}
                disabled={isEstimating || !formData.proprietaire}
              >
                {isEstimating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estimation...
                  </>
                ) : (
                  'Estimer le coût'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche par zone géographique</CardTitle>
              <CardDescription>
                Dessinez une zone sur la carte pour trouver tous les propriétaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Comment ça marche ?</AlertTitle>
                <AlertDescription>
                  Utilisez les outils en haut à droite de la carte pour dessiner un rectangle
                  ou un polygone. L'estimation s'affichera automatiquement.
                </AlertDescription>
              </Alert>

              <MapSearch onZoneSelected={handleZoneEstimate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estimation Results */}
      {estimate && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat de l'estimation</CardTitle>
            <CardDescription>
              Vérifiez le coût avant de valider votre recherche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Propriétaires trouvés
                </p>
                <p className="text-2xl font-bold">
                  {estimate.estimatedRows.toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Coût en crédits
                </p>
                <p className="text-2xl font-bold">
                  {estimate.estimatedCost.toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Solde après recherche
                </p>
                <p className={`text-2xl font-bold ${estimate.canProceed ? 'text-green-600' : 'text-red-600'}`}>
                  {estimate.remainingBalance.toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {!estimate.canProceed ? (
              <Alert variant="destructive">
                <AlertTitle>Crédits insuffisants</AlertTitle>
                <AlertDescription>
                  Vous n'avez pas assez de crédits pour cette recherche.{' '}
                  <a href="/pricing" className="underline">
                    Acheter des crédits
                  </a>
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                onClick={handleValidateAndExecute}
                disabled={isExecuting}
                className="w-full"
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exécution en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Valider et télécharger les résultats
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
