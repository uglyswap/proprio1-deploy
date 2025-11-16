"use client"

import { useState } from 'react'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Database,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Edit,
  Trash2,
  Play,
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  type: string
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'ERROR'
  host?: string
  port?: number
  database?: string
  tableName?: string
  recordCount?: number
  lastTestedAt?: string
  lastTestStatus?: string
  lastTestError?: string
}

export default function SuperAdminDataSourcesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    schema: 'public',
    tableName: '',
  })

  const handleTestConnection = async (id?: string) => {
    // Test connection logic
    console.log('Testing connection...', id || formData)
  }

  const handleSaveDataSource = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/superadmin/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsAddDialogOpen(false)
        // Refresh list
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    TESTING: 'bg-blue-100 text-blue-800',
    ERROR: 'bg-red-100 text-red-800',
  }

  const statusIcons = {
    ACTIVE: CheckCircle2,
    INACTIVE: AlertCircle,
    TESTING: Play,
    ERROR: XCircle,
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="h-8 w-8" />
              Sources de Données
            </h1>
            <p className="text-gray-600 mt-1">
              Connectez vos bases PostgreSQL (Propriétaires, SIRENE, etc.)
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle Source de Données</DialogTitle>
                <DialogDescription>
                  Connectez une base de données PostgreSQL externe
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom de la source <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="ex: Base Propriétaires, SIRENE, etc."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Un nom descriptif pour identifier cette source
                  </p>
                </div>

                {/* Connection Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">
                      Hôte <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="host"
                      placeholder="localhost ou IP"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="5432"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="database">
                    Nom de la base <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="database"
                    placeholder="nom_de_la_base"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      Utilisateur <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      placeholder="postgres"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Mot de passe <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schema">Schéma</Label>
                    <Input
                      id="schema"
                      placeholder="public"
                      value={formData.schema}
                      onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tableName">Nom de la table</Label>
                    <Input
                      id="tableName"
                      placeholder="proprietaires, sirene, etc."
                      value={formData.tableName}
                      onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Les mots de passe sont chiffrés avant d'être stockés. Assurez-vous que votre base de données autorise les connexions depuis ce serveur.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection()}
                    disabled={!formData.name || !formData.host || !formData.database}
                  >
                    Tester la connexion
                  </Button>
                  <Button
                    onClick={handleSaveDataSource}
                    disabled={isLoading || !formData.name || !formData.host || !formData.database}
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>1. Connectez vos bases :</strong> Ajoutez vos bases PostgreSQL contenant les données immobilières (propriétaires, SIRENE, etc.)
            </p>
            <p>
              <strong>2. Testez la connexion :</strong> Le système vérifie que la connexion fonctionne et compte les enregistrements
            </p>
            <p>
              <strong>3. Mappez les colonnes :</strong> Indiquez quelle colonne correspond à quoi (adresse, SIREN, nom, etc.)
            </p>
            <p>
              <strong>4. Activez la source :</strong> Une fois configurée, la source sera utilisée pour les recherches
            </p>
          </CardContent>
        </Card>

        {/* Data Sources List */}
        {dataSources.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune source de données
                </h3>
                <p className="text-gray-600 mb-6">
                  Commencez par ajouter votre première source de données PostgreSQL
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter votre première source
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {dataSources.map((source) => {
              const StatusIcon = statusIcons[source.status]

              return (
                <Card key={source.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-3">
                          {source.name}
                          <Badge className={statusColors[source.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {source.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {source.host}:{source.port} / {source.database} / {source.tableName}
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleTestConnection(source.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Enregistrements</div>
                        <div className="font-semibold text-lg">
                          {source.recordCount?.toLocaleString() || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Dernier test</div>
                        <div className="font-medium">
                          {source.lastTestedAt ? new Date(source.lastTestedAt).toLocaleDateString() : 'Jamais'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Statut du test</div>
                        <div className={source.lastTestStatus === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {source.lastTestStatus === 'success' ? '✓ Succès' : source.lastTestError || '—'}
                        </div>
                      </div>
                    </div>

                    {source.status === 'ACTIVE' && (
                      <Button variant="link" className="mt-4 p-0 h-auto">
                        Configurer le mapping des colonnes <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
