'use client'

import { useState, useEffect } from 'react'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Edit, Flag } from 'lucide-react'

interface FeatureFlag {
  id: string
  name: string
  description: string | null
  isEnabled: boolean
  rolloutPercent: number
  allowedPlans: string[]
  createdAt: Date
  updatedAt: Date
}

export default function FeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isEnabled: false,
    rolloutPercent: 100,
    allowedPlans: [] as string[],
  })

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/superadmin/feature-flags')
      const data = await res.json()
      setFlags(data.flags || [])
    } catch (error) {
      console.error('Failed to fetch flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await fetch('/api/superadmin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFlag?.id,
          ...formData,
        }),
      })

      setDialogOpen(false)
      setEditingFlag(null)
      resetForm()
      fetchFlags()
    } catch (error) {
      console.error('Failed to save flag:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette feature flag ?')) return

    try {
      await fetch(`/api/superadmin/feature-flags?id=${id}`, {
        method: 'DELETE',
      })
      fetchFlags()
    } catch (error) {
      console.error('Failed to delete flag:', error)
    }
  }

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag)
    setFormData({
      name: flag.name,
      description: flag.description || '',
      isEnabled: flag.isEnabled,
      rolloutPercent: flag.rolloutPercent,
      allowedPlans: flag.allowedPlans,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isEnabled: false,
      rolloutPercent: 100,
      allowedPlans: [],
    })
  }

  const togglePlan = (plan: string) => {
    setFormData(prev => ({
      ...prev,
      allowedPlans: prev.allowedPlans.includes(plan)
        ? prev.allowedPlans.filter(p => p !== plan)
        : [...prev.allowedPlans, plan],
    }))
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Feature Flags
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Contrôlez les fonctionnalités de votre SaaS en temps réel
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingFlag(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFlag ? 'Modifier' : 'Créer'} Feature Flag
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: advanced_search"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la fonctionnalité"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Activé</Label>
                  <Switch
                    checked={formData.isEnabled}
                    onCheckedChange={checked => setFormData({ ...formData, isEnabled: checked })}
                  />
                </div>

                <div>
                  <Label>Rollout Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.rolloutPercent}
                    onChange={e => setFormData({ ...formData, rolloutPercent: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pourcentage d'utilisateurs qui auront accès (0-100)
                  </p>
                </div>

                <div>
                  <Label>Plans autorisés</Label>
                  <div className="flex gap-2 mt-2">
                    {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map(plan => (
                      <Button
                        key={plan}
                        size="sm"
                        variant={formData.allowedPlans.includes(plan) ? 'default' : 'outline'}
                        onClick={() => togglePlan(plan)}
                      >
                        {plan}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave}>
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Features List */}
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : flags.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Aucune feature flag configurée
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la première
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {flags.map(flag => (
              <Card key={flag.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{flag.name}</CardTitle>
                      <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                        {flag.isEnabled ? 'Activé' : 'Désactivé'}
                      </Badge>
                      {flag.rolloutPercent < 100 && (
                        <Badge variant="outline">{flag.rolloutPercent}% rollout</Badge>
                      )}
                    </div>
                    {flag.description && (
                      <CardDescription className="mt-2">{flag.description}</CardDescription>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(flag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(flag.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>

                {flag.allowedPlans.length > 0 && (
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Plans:</span>
                      {flag.allowedPlans.map(plan => (
                        <Badge key={plan} variant="secondary">
                          {plan}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
