"use client"

import { useState } from 'react'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Plug,
  Plus,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  Edit,
  Trash2,
} from 'lucide-react'

interface ApiConfig {
  id: string
  name: string
  category: string
  isActive: boolean
  lastTested?: string
}

export default function SuperAdminApisPage() {
  const [apis, setApis] = useState<ApiConfig[]>([])
  const [dropcontactKey, setDropcontactKey] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSaveDropcontact = async () => {
    try {
      const response = await fetch('/api/superadmin/apis/dropcontact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: dropcontactKey }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '✅ API Dropcontact configurée !' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur de configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur réseau' })
    }
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Plug className="h-8 w-8" />
            Gestion des APIs
          </h1>
          <p className="text-gray-600 mt-1">
            Configurez les APIs externes utilisées par le SaaS
          </p>
        </div>

        {/* Dropcontact API */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Dropcontact API</CardTitle>
                <CardDescription>
                  API d'enrichissement des contacts (email, téléphone, LinkedIn)
                </CardDescription>
              </div>
              <Badge variant="outline">Enrichissement</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dropcontactKey">
                  API Key <Badge variant="outline" className="ml-2">Chiffré</Badge>
                </Label>
                <Input
                  id="dropcontactKey"
                  type="password"
                  placeholder="Votre clé API Dropcontact"
                  value={dropcontactKey}
                  onChange={(e) => setDropcontactKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Obtenez votre clé sur{' '}
                  <a
                    href="https://www.dropcontact.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    dropcontact.com
                  </a>
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Activer l'enrichissement</div>
                  <div className="text-sm text-gray-600">
                    Disponible pour les plans PRO et ENTERPRISE
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Coût par enrichissement</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    defaultValue="5"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">crédits par contact enrichi</span>
                </div>
              </div>

              <Button onClick={handleSaveDropcontact} disabled={!dropcontactKey}>
                Enregistrer la configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Autres APIs futures */}
        <Card>
          <CardHeader>
            <CardTitle>Autres APIs disponibles</CardTitle>
            <CardDescription>
              Intégrations supplémentaires que vous pouvez activer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pappers API */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Pappers API</div>
                    <div className="text-sm text-gray-600">
                      Données entreprises françaises (SIREN, SIRET, dirigeants)
                    </div>
                  </div>
                </div>
                <Badge variant="outline">Bientôt disponible</Badge>
              </div>

              {/* Google Maps Geocoding */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Key className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Google Maps Geocoding</div>
                    <div className="text-sm text-gray-600">
                      Géocodage d'adresses pour améliorer la précision
                    </div>
                  </div>
                </div>
                <Badge variant="outline">Bientôt disponible</Badge>
              </div>

              {/* INSEE SIRENE */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">API SIRENE (INSEE)</div>
                    <div className="text-sm text-gray-600">
                      Base officielle des entreprises françaises (gratuit)
                    </div>
                  </div>
                </div>
                <Badge variant="outline">Bientôt disponible</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques d'utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">Appels ce mois</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">0€</div>
                <div className="text-sm text-gray-600">Coût total</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">—</div>
                <div className="text-sm text-gray-600">Dernière utilisation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
