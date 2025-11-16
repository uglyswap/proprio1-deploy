'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Check, Zap, Shield, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const plans = [
  {
    name: 'Basic',
    price: '29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    credits: 500,
    results: 50,
    description: 'Parfait pour démarrer',
    features: [
      '500 crédits inclus (~50 résultats)',
      'Recherche par adresse, propriétaire, zone',
      'Données enrichies avec liens Pappers, Cadastre, DVF',
      'Export CSV complet',
      'Support par email',
      'Historique des recherches',
    ],
    extraCost: '0,06',
  },
  {
    name: 'Pro',
    price: '99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    credits: 2000,
    results: 200,
    description: 'Le plus populaire',
    popular: true,
    features: [
      '2 000 crédits inclus (~200 résultats)',
      'Toutes les fonctionnalités Basic',
      'Enrichissement SIRENE automatique',
      'Emails et téléphones vérifiés',
      'Support prioritaire',
      'Dashboard analytics avancé',
      'Historique illimité',
    ],
    extraCost: '0,05',
  },
  {
    name: 'Enterprise',
    price: '349',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    credits: 10000,
    results: 1000,
    description: 'Pour les professionnels',
    features: [
      '10 000 crédits inclus (~1000 résultats)',
      'Toutes les fonctionnalités Pro',
      'Enrichissement prioritaire multi-sources',
      'Accès API REST',
      'Support dédié 7j/7',
      'Utilisateurs illimités',
      'Exports automatisés',
      'Intégration CRM personnalisée',
    ],
    extraCost: '0,04',
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
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          {/* AIDA: ATTENTION - Header with emotional appeal */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Tarification transparente
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Un prix juste qui s'adapte à votre activité
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Payez uniquement pour les résultats que vous validez.
              <span className="block mt-2 font-semibold text-gray-900">
                Aucun engagement • Annulation en 1 clic • Essai gratuit 7 jours
              </span>
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Changez de plan à tout moment</span>
              </div>
            </div>
          </div>

          {/* Pricing explanation */}
          <div className="max-w-2xl mx-auto mb-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Comment fonctionne la tarification ?
            </h3>
            <p className="text-blue-800 text-lg">
              <span className="font-bold text-2xl">10 crédits = 1 résultat validé</span>
            </p>
            <p className="text-blue-700 mt-2 text-sm">
              Vous visualisez d'abord une estimation gratuite, puis vous ne payez que si vous validez le résultat.
              Les crédits non utilisés sont réinitialisés chaque mois.
            </p>
          </div>

          {/* AIDA: INTEREST - Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular
                    ? 'border-2 border-blue-500 shadow-2xl scale-105 bg-gradient-to-b from-white to-blue-50'
                    : 'border-2 hover:border-blue-300 hover:shadow-xl transition-all'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                      ⭐ Le plus populaire
                    </Badge>
                  </div>
                )}

                <CardHeader className={plan.popular ? 'pb-4' : ''}>
                  <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}€</span>
                      <span className="text-gray-500 text-lg">/mois</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="text-lg font-semibold text-blue-600">
                        {plan.credits.toLocaleString('fr-FR')} crédits
                      </div>
                      <div className="text-sm text-gray-600">
                        Soit environ {plan.results} résultats/mois
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        + {plan.extraCost}€/résultat supplémentaire
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  {user ? (
                    <Button
                      className="w-full h-12 text-base"
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      disabled={isLoading === plan.priceId}
                      onClick={() => handleSubscribe(plan.priceId)}
                    >
                      {isLoading === plan.priceId ? 'Redirection...' : 'Souscrire maintenant'}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full h-12 text-base"
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      <Link href="/auth/signup">
                        Essai gratuit 7 jours
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* AIDA: DESIRE - Comparison table */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Comparez les fonctionnalités
              </h2>
              <p className="text-lg text-gray-600">
                Choisissez le plan qui correspond le mieux à vos besoins
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Fonctionnalité</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">Basic</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-blue-50">Pro</th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Crédits mensuels</td>
                      <td className="text-center py-4 px-6">500</td>
                      <td className="text-center py-4 px-6 bg-blue-50">2 000</td>
                      <td className="text-center py-4 px-6">10 000</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Résultats environ</td>
                      <td className="text-center py-4 px-6">~50/mois</td>
                      <td className="text-center py-4 px-6 bg-blue-50">~200/mois</td>
                      <td className="text-center py-4 px-6">~1000/mois</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Recherche multi-sources</td>
                      <td className="text-center py-4 px-6"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center py-4 px-6 bg-blue-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center py-4 px-6"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Enrichissement SIRENE</td>
                      <td className="text-center py-4 px-6 text-gray-400">-</td>
                      <td className="text-center py-4 px-6 bg-blue-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center py-4 px-6"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Analytics avancé</td>
                      <td className="text-center py-4 px-6 text-gray-400">-</td>
                      <td className="text-center py-4 px-6 bg-blue-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center py-4 px-6"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Accès API</td>
                      <td className="text-center py-4 px-6 text-gray-400">-</td>
                      <td className="text-center py-4 px-6 bg-blue-50 text-gray-400">-</td>
                      <td className="text-center py-4 px-6"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Utilisateurs</td>
                      <td className="text-center py-4 px-6">1</td>
                      <td className="text-center py-4 px-6 bg-blue-50">3</td>
                      <td className="text-center py-4 px-6">Illimité</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">Support</td>
                      <td className="text-center py-4 px-6 text-sm">Email</td>
                      <td className="text-center py-4 px-6 bg-blue-50 text-sm">Prioritaire</td>
                      <td className="text-center py-4 px-6 text-sm">Dédié 7j/7</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* AIDA: DESIRE - FAQ */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Questions fréquentes sur la tarification
              </h2>
              <p className="text-lg text-gray-600">
                Tout ce que vous devez savoir avant de vous lancer
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Comment fonctionnent les crédits exactement ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Vous achetez des crédits selon votre formule d'abonnement. <strong>10 crédits = 1 résultat validé</strong>.
                  Vous visualisez d'abord gratuitement une estimation du nombre de résultats, puis vous validez
                  la recherche qui débitera vos crédits. Vous ne payez que pour les résultats que vous consultez effectivement.
                  Les crédits non utilisés ne sont pas reportés d'un mois à l'autre.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Puis-je changer de plan en cours de route ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Oui, absolument ! Vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis
                  votre dashboard. En cas d'upgrade, vous êtes facturé au prorata. En cas de downgrade,
                  le changement prend effet à la prochaine période de facturation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Que se passe-t-il si je dépasse mes crédits ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Les résultats supplémentaires sont facturés au tarif indiqué dans votre plan
                  (entre 0,04€ et 0,06€ par résultat selon votre formule). Vous recevez une notification
                  lorsque vous atteignez 80% de vos crédits. Vous pouvez aussi upgrader votre plan à tout moment.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  L'essai gratuit est-il vraiment gratuit ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Oui ! L'essai gratuit de 7 jours vous donne accès à toutes les fonctionnalités du plan Pro
                  avec 100 crédits offerts. Aucune carte bancaire n'est requise à l'inscription.
                  Au bout de 7 jours, vous décidez si vous souhaitez continuer avec un abonnement payant.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Comment annuler mon abonnement ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Vous pouvez annuler votre abonnement en 1 clic depuis votre dashboard dans les paramètres.
                  Aucun engagement, aucune question posée. Vous gardez l'accès à la plateforme jusqu'à
                  la fin de votre période déjà payée. Vos données et historique sont conservés pendant 30 jours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Proposez-vous des réductions pour les volumes importants ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Oui ! Si vous avez besoin de plus de 10 000 crédits par mois, contactez notre équipe commerciale
                  pour obtenir un devis personnalisé. Nous proposons des tarifs dégressifs pour les gros volumes
                  ainsi que des options d'intégration API avancées.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-2 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  Les données sont-elles légales et conformes RGPD ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  Absolument. Nous utilisons exclusivement des données publiques issues de sources officielles
                  (DGFiP, INSEE, cadastre, DVF, SIRENE). Toutes nos pratiques sont 100% conformes au RGPD et
                  à la réglementation française sur la protection des données personnelles.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* AIDA: ACTION - Final CTA */}
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white rounded-2xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à trouver vos propriétaires ?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Essayez gratuitement pendant 7 jours. Sans carte bancaire.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl text-lg px-8 h-14">
                  <Link href="/auth/signup">
                    Commencer l'essai gratuit
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 h-14">
                  <Link href="/">
                    En savoir plus
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-sm text-blue-200">
                Rejoignez les centaines de professionnels qui nous font confiance
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
