'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'

const plans = [
  {
    name: 'Basic',
    price: '29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    credits: '500',
    description: 'Pour commencer',
    features: [
      '500 lignes incluses',
      'Données brutes + liens',
      'Support par email',
      '0,06€/ligne supplémentaire',
      'Export CSV',
    ],
  },
  {
    name: 'Pro',
    price: '99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    credits: '3 000',
    description: 'Le plus populaire',
    popular: true,
    features: [
      '3 000 lignes incluses',
      'Données brutes + liens',
      'Enrichissement contact (email/téléphone)',
      'Support prioritaire',
      '0,04€/ligne supplémentaire',
      'Export CSV',
      'Historique illimité',
    ],
  },
  {
    name: 'Enterprise',
    price: '349',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    credits: '20 000',
    description: 'Pour les grandes équipes',
    features: [
      '20 000 lignes incluses',
      'Toutes données enrichies',
      'Enrichissement prioritaire',
      'Support dédié',
      'Accès API',
      '0,03€/ligne supplémentaire',
      'Export CSV',
      'Utilisateurs illimités',
    ],
  },
]

export default function PricingPage() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  async function handleSubscribe(priceId: string | undefined) {
    if (!priceId) return

    setIsLoading(priceId)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Tarifs simples et transparents
          </h1>
          <p className="text-xl text-muted-foreground">
            Choisissez le plan adapté à vos besoins. Pas d'engagement, annulez quand vous voulez.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">Le plus populaire</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {plan.credits} crédits inclus
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {user ? (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isLoading === plan.priceId}
                    onClick={() => handleSubscribe(plan.priceId)}
                  >
                    {isLoading === plan.priceId
                      ? 'Redirection...'
                      : 'Souscrire'}
                  </Button>
                ) : (
                  <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    <Link href="/auth/signup">Commencer</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Questions fréquentes
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comment fonctionnent les crédits ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  1 crédit = 1 ligne de résultat. Vous voyez d'abord une estimation gratuite,
                  puis vous validez la recherche qui débitera vos crédits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Puis-je changer de plan ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment.
                  Les changements sont appliqués immédiatement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Que se passe-t-il si je dépasse mes crédits ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les lignes supplémentaires sont facturées au tarif indiqué dans votre plan.
                  Vous pouvez aussi acheter des packs de crédits supplémentaires.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
