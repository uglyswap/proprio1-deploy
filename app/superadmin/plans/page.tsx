"use client"

import { useState } from 'react'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
} from 'lucide-react'

interface Plan {
  id: string
  plan: string
  displayName: string
  monthlyPrice: number
  yearlyPrice?: number
  monthlyCredits: number
  creditsPerResult: number
  canUseEnrichment: boolean
  canUseAPI: boolean
  maxTeamMembers: number
  isActive: boolean
  isVisible: boolean
  sortOrder: number
}

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      plan: 'FREE',
      displayName: 'Gratuit',
      monthlyPrice: 0,
      monthlyCredits: 0,
      creditsPerResult: 10,
      canUseEnrichment: false,
      canUseAPI: false,
      maxTeamMembers: 1,
      isActive: true,
      isVisible: true,
      sortOrder: 1,
    },
    {
      id: '2',
      plan: 'BASIC',
      displayName: 'Basic',
      monthlyPrice: 29,
      yearlyPrice: 290,
      monthlyCredits: 500,
      creditsPerResult: 10,
      canUseEnrichment: false,
      canUseAPI: false,
      maxTeamMembers: 3,
      isActive: true,
      isVisible: true,
      sortOrder: 2,
    },
    {
      id: '3',
      plan: 'PRO',
      displayName: 'Pro',
      monthlyPrice: 99,
      yearlyPrice: 990,
      monthlyCredits: 3000,
      creditsPerResult: 10,
      canUseEnrichment: true,
      canUseAPI: false,
      maxTeamMembers: 10,
      isActive: true,
      isVisible: true,
      sortOrder: 3,
    },
    {
      id: '4',
      plan: 'ENTERPRISE',
      displayName: 'Enterprise',
      monthlyPrice: 349,
      yearlyPrice: 3490,
      monthlyCredits: 20000,
      creditsPerResult: 10,
      canUseEnrichment: true,
      canUseAPI: true,
      maxTeamMembers: 50,
      isActive: true,
      isVisible: true,
      sortOrder: 4,
    },
  ])

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setIsEditDialogOpen(true)
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return

    // API call to save plan
    console.log('Saving plan:', editingPlan)
    setIsEditDialogOpen(false)
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="h-8 w-8" />
              Plans & Tarifs
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos offres d'abonnement et leurs fonctionnalités
            </p>
          </div>

          <Button className="gap-2" onClick={() => {
            setEditingPlan({
              id: 'new',
              plan: 'CUSTOM',
              displayName: 'Nouveau Plan',
              monthlyPrice: 0,
              monthlyCredits: 0,
              creditsPerResult: 10,
              canUseEnrichment: false,
              canUseAPI: false,
              maxTeamMembers: 1,
              isActive: false,
              isVisible: false,
              sortOrder: 5,
            })
            setIsEditDialogOpen(true)
          }}>
            <Plus className="h-4 w-4" />
            Créer un plan
          </Button>
        </div>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres Globaux</CardTitle>
            <CardDescription>
              Configuration générale du système de crédits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Crédits par résultat</Label>
                <Input type="number" defaultValue="10" />
                <p className="text-xs text-gray-500">
                  Nombre de crédits nécessaires pour 1 ligne de résultat
                </p>
              </div>

              <div className="space-y-2">
                <Label>Crédits par enrichissement</Label>
                <Input type="number" defaultValue="5" />
                <p className="text-xs text-gray-500">
                  Coût additionnel pour enrichir un contact
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Reset mensuel automatique</div>
                <div className="text-sm text-gray-600">
                  Les crédits se rechargent tous les mois (pas d'accumulation)
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.displayName}
                      {!plan.isActive && <Badge variant="outline">Inactif</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {plan.monthlyPrice}€
                      </span>
                      /mois
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Crédits mensuels</span>
                    <span className="font-semibold">{plan.monthlyCredits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Membres max</span>
                    <span className="font-semibold">{plan.maxTeamMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Enrichissement</span>
                    {plan.canUseEnrichment ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">API Access</span>
                    {plan.canUseAPI ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {plan.plan !== 'FREE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan?.id === 'new' ? 'Créer un plan' : 'Modifier le plan'}
              </DialogTitle>
              <DialogDescription>
                Configurez les prix, crédits et fonctionnalités
              </DialogDescription>
            </DialogHeader>

            {editingPlan && (
              <div className="space-y-6 mt-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du plan</Label>
                      <Input
                        value={editingPlan.displayName}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          displayName: e.target.value,
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Code interne</Label>
                      <Input
                        value={editingPlan.plan}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          plan: e.target.value,
                        })}
                        className="uppercase"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prix mensuel (€)</Label>
                      <Input
                        type="number"
                        value={editingPlan.monthlyPrice}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          monthlyPrice: parseFloat(e.target.value),
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prix annuel (€)</Label>
                      <Input
                        type="number"
                        value={editingPlan.yearlyPrice || ''}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          yearlyPrice: parseFloat(e.target.value),
                        })}
                      />
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Crédits mensuels</Label>
                      <Input
                        type="number"
                        value={editingPlan.monthlyCredits}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          monthlyCredits: parseInt(e.target.value),
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Membres max</Label>
                      <Input
                        type="number"
                        value={editingPlan.maxTeamMembers}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          maxTeamMembers: parseInt(e.target.value),
                        })}
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <Label>Fonctionnalités</Label>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Enrichissement de contacts</div>
                        <div className="text-xs text-gray-600">
                          Via Dropcontact (email, téléphone, LinkedIn)
                        </div>
                      </div>
                      <Switch
                        checked={editingPlan.canUseEnrichment}
                        onCheckedChange={(checked) => setEditingPlan({
                          ...editingPlan,
                          canUseEnrichment: checked,
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Accès API REST</div>
                        <div className="text-xs text-gray-600">
                          Pour intégration externe
                        </div>
                      </div>
                      <Switch
                        checked={editingPlan.canUseAPI}
                        onCheckedChange={(checked) => setEditingPlan({
                          ...editingPlan,
                          canUseAPI: checked,
                        })}
                      />
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Plan actif</div>
                        <div className="text-xs text-gray-600">
                          Les clients peuvent souscrire
                        </div>
                      </div>
                      <Switch
                        checked={editingPlan.isActive}
                        onCheckedChange={(checked) => setEditingPlan({
                          ...editingPlan,
                          isActive: checked,
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Visible sur la page pricing</div>
                        <div className="text-xs text-gray-600">
                          Affiché publiquement
                        </div>
                      </div>
                      <Switch
                        checked={editingPlan.isVisible}
                        onCheckedChange={(checked) => setEditingPlan({
                          ...editingPlan,
                          isVisible: checked,
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSavePlan}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
