'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/hooks/use-organization'
import { CreditCard, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const PLAN_FEATURES = {
  FREE: {
    name: 'Gratuit',
    price: '0€',
    credits: '100',
    features: ['100 crédits de bienvenue', 'Données de base', 'Support communautaire'],
  },
  BASIC: {
    name: 'Basic',
    price: '29€',
    credits: '500',
    features: ['500 lignes/mois', 'Données + liens', 'Support email'],
  },
  PRO: {
    name: 'Pro',
    price: '99€',
    credits: '3 000',
    features: ['3 000 lignes/mois', 'Enrichissement contacts', 'Support prioritaire'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: '349€',
    credits: '20 000',
    features: ['20 000 lignes/mois', 'Toutes fonctionnalités', 'Support dédié'],
  },
}

export default function BillingPage() {
  const { organization } = useOrganization()
  const [isLoading, setIsLoading] = useState(false)

  async function handleManageSubscription() {
    setIsLoading(true)

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!organization) {
    return <div>Chargement...</div>
  }

  const currentPlan = PLAN_FEATURES[organization.plan]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturation</h1>
        <p className="text-muted-foreground">
          Gérez votre abonnement et vos factures
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>
                Votre abonnement {currentPlan.name}
              </CardDescription>
            </div>
            <Badge className="text-lg px-4 py-2">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Prix mensuel
              </p>
              <p className="text-2xl font-bold">
                {currentPlan.price}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Crédits mensuels
              </p>
              <p className="text-2xl font-bold">
                {currentPlan.credits}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Fonctionnalités incluses:</p>
            <ul className="space-y-1">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 flex gap-4">
            {organization.plan !== 'FREE' && (
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isLoading ? 'Chargement...' : 'Gérer l\'abonnement'}
              </Button>
            )}

            <Button asChild variant="outline">
              <Link href="/pricing">
                <ExternalLink className="h-4 w-4 mr-2" />
                Changer de plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      {organization.plan !== 'FREE' && (
        <Card>
          <CardHeader>
            <CardTitle>Méthode de paiement</CardTitle>
            <CardDescription>
              Gérez vos moyens de paiement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Vos informations de paiement sont sécurisées par Stripe.
            </p>
            <Button
              onClick={handleManageSubscription}
              variant="outline"
              disabled={isLoading}
            >
              Mettre à jour le moyen de paiement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>
            Téléchargez vos factures passées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Vos factures sont disponibles dans le portail Stripe.
          </p>
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Voir mes factures
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
