import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  MapPin,
  User,
  Map,
  Mail,
  Phone,
  Database,
  Download,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  Star,
  ArrowRight,
  Building2,
  FileText,
  Clock
} from 'lucide-react'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* AIDA: ATTENTION - Hero Section with emotional appeal */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20 md:py-32">
          {/* Glassmorphism background effect */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20" />

          <div className="container relative mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              {/* New feature badge */}
              <Badge className="mb-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
                <Zap className="h-3 w-3 mr-1" />
                Nouveauté : Enrichissement automatique avec données SIRENE
              </Badge>

              {/* Main headline - Emotional + Benefit-driven */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Trouvez n'importe quel propriétaire en France
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 mt-2">
                  en 30 secondes
                </span>
              </h1>

              {/* Sub-headline - Pain point + Solution */}
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
                Fini les recherches interminables. Accédez instantanément aux coordonnées de
                <span className="font-semibold text-white"> 50+ millions de propriétaires</span> avec
                emails, téléphones et données enrichies.
              </p>

              {/* Social proof stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10 max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-2xl md:text-4xl font-bold mb-1">50M+</div>
                  <div className="text-sm md:text-base text-blue-100">Biens immobiliers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-2xl md:text-4xl font-bold mb-1">2.4M+</div>
                  <div className="text-sm md:text-base text-blue-100">Entreprises</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-2xl md:text-4xl font-bold mb-1">98%</div>
                  <div className="text-sm md:text-base text-blue-100">Taux de réussite</div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all text-lg px-8 h-14">
                  <Link href="/auth/signup">
                    Essai gratuit - Aucune CB requise
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all text-lg px-8 h-14">
                  <Link href="#demo">
                    Voir la démo
                  </Link>
                </Button>
              </div>

              {/* Trust signals */}
              <p className="mt-8 text-sm text-blue-200 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Aucune carte bancaire requise
                <span className="mx-2">•</span>
                <CheckCircle2 className="h-4 w-4" />
                Essai gratuit 7 jours
                <span className="mx-2">•</span>
                <CheckCircle2 className="h-4 w-4" />
                Annulation en 1 clic
              </p>
            </div>
          </div>
        </section>

        {/* AIDA: INTEREST - How it works / Features with benefits */}
        <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4" variant="outline">
                Fonctionnalités
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                3 façons de trouver vos propriétaires
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Choisissez votre méthode de recherche. Obtenez les résultats en quelques secondes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {/* Feature 1: By Address */}
              <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                    <MapPin className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-2xl">Recherche par adresse</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Tapez une adresse, obtenez instantanément tous les propriétaires du bien avec leurs coordonnées complètes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Historique des propriétaires</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Emails et téléphones vérifiés</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Liens Pappers, Cadastre, DVF</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2: By Owner */}
              <Card className="border-2 hover:border-purple-500 hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                    <User className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-2xl">Recherche par propriétaire</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Découvrez l'intégralité du patrimoine immobilier d'une personne ou entreprise en quelques clics.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Portfolio complet de biens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Données SIRENE enrichies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Analyse patrimoniale détaillée</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3: By Zone */}
              <Card className="border-2 hover:border-green-500 hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                    <Map className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-2xl">Recherche géographique</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Dessinez une zone sur la carte et obtenez tous les propriétaires du secteur en un instant.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Prospection ciblée par zone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Export CSV de tous les biens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Filtres avancés disponibles</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Additional benefits */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Données toujours à jour</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Base mise à jour quotidiennement</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Export instantané</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">CSV avec tous les liens enrichis</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">100% conforme RGPD</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Données publiques et légales</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Résultats en 30s</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Infrastructure ultra-rapide</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AIDA: DESIRE - Social proof / Testimonials */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4" variant="outline">
                Témoignages
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Ils nous font confiance
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Des professionnels de l'immobilier qui ont transformé leur prospection
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                    "J'ai divisé par 10 mon temps de prospection. Je trouve les propriétaires en quelques secondes au lieu de plusieurs heures. Un outil indispensable !"
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white">MC</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold dark:text-white">Marie Clement</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Agent immobilier, Paris</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                    "La qualité des données est exceptionnelle. Emails vérifiés, liens directs vers Pappers... C'est du temps précieux gagné sur chaque dossier."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-600 text-white">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold dark:text-white">Jean Dupont</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Promoteur immobilier, Lyon</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 3 */}
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                    "L'export CSV est parfait. Je récupère toutes mes données en un clic et j'intègre directement dans mon CRM. Exactement ce dont j'avais besoin."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-600 text-white">SL</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold dark:text-white">Sophie Leroy</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Gestionnaire de patrimoine, Bordeaux</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="mb-4" variant="outline">
                Tarification
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Un prix juste et transparent
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Payez uniquement pour les résultats que vous validez. Sans engagement.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 border-2 dark:border-gray-700 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">€29</div>
                  <div className="text-gray-600 dark:text-gray-300 mb-4">/mois</div>
                  <div className="text-2xl font-semibold dark:text-white mb-2">500 crédits</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Soit ~50 résultats/mois</div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-2 border-blue-600 rounded-lg p-6 text-center relative transform scale-105 shadow-xl">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900">
                    Populaire
                  </Badge>
                  <div className="text-4xl font-bold mb-2">€99</div>
                  <div className="text-blue-100 mb-4">/mois</div>
                  <div className="text-2xl font-semibold mb-2">2000 crédits</div>
                  <div className="text-sm text-blue-100">Soit ~200 résultats/mois</div>
                </div>

                <div className="bg-white dark:bg-gray-800 border-2 dark:border-gray-700 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">€349</div>
                  <div className="text-gray-600 dark:text-gray-300 mb-4">/mois</div>
                  <div className="text-2xl font-semibold dark:text-white mb-2">10000 crédits</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Soit ~1000 résultats/mois</div>
                </div>
              </div>

              <div className="text-center">
                <Button asChild size="lg" className="shadow-lg">
                  <Link href="/pricing">
                    Voir tous les détails
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  10 crédits = 1 résultat • Crédits réinitialisés chaque mois • Aucun engagement
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4" variant="outline">
                FAQ
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Questions fréquentes
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Tout ce que vous devez savoir sur ProprioFinder
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6 dark:border-gray-700">
                  <AccordionTrigger className="text-left font-semibold dark:text-white">
                    Comment fonctionne le système de crédits ?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Vous achetez des crédits selon votre formule. 10 crédits = 1 résultat validé.
                    Vous ne payez que pour les résultats que vous choisissez de consulter.
                    Les crédits non utilisés ne sont pas reportés d'un mois à l'autre.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-6 dark:border-gray-700">
                  <AccordionTrigger className="text-left font-semibold dark:text-white">
                    D'où viennent les données ?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Nous agrégeons des données publiques issues des fichiers fonciers (DGFiP),
                    du cadastre, de DVF et de la base SIRENE. Toutes nos données sont 100% légales et conformes RGPD.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-6 dark:border-gray-700">
                  <AccordionTrigger className="text-left font-semibold dark:text-white">
                    Quelle est la fiabilité des coordonnées ?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Nous enrichissons les données avec plusieurs sources (Pappers, SIRENE) pour garantir
                    un taux de fiabilité de 98%. Les emails et téléphones sont vérifiés et mis à jour quotidiennement.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-6 dark:border-gray-700">
                  <AccordionTrigger className="text-left font-semibold dark:text-white">
                    Puis-je annuler mon abonnement à tout moment ?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Oui, absolument. Vous pouvez annuler votre abonnement en 1 clic depuis votre dashboard.
                    Aucun engagement, aucune question posée. Vous gardez accès jusqu'à la fin de votre période payée.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-6 dark:border-gray-700">
                  <AccordionTrigger className="text-left font-semibold dark:text-white">
                    Comment fonctionne l'essai gratuit ?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    L'essai gratuit vous donne accès à toutes les fonctionnalités pendant 7 jours.
                    Aucune carte bancaire n'est requise à l'inscription. Vous pourrez effectuer des recherches
                    et découvrir la plateforme sans aucun engagement.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-6 dark:border-gray-700">
                  <AccordionTrigger className="text-left font-semibold dark:text-white">
                    Quelle couverture géographique ?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    ProprioFinder couvre l'intégralité du territoire français avec plus de 50 millions de biens
                    immobiliers référencés. DOM-TOM inclus.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* AIDA: ACTION - Final CTA */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />

          <div className="container relative mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Prêt à transformer votre prospection ?
              </h2>
              <p className="text-xl text-blue-100 mb-10 leading-relaxed">
                Rejoignez les centaines de professionnels qui trouvent leurs propriétaires en 30 secondes.
                Essai gratuit 7 jours, aucune carte bancaire requise.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all text-lg px-8 h-14">
                  <Link href="/auth/signup">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all text-lg px-8 h-14">
                  <Link href="/pricing">
                    Voir les tarifs
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Essai gratuit 7 jours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Sans carte bancaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Annulation instantanée</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Support 7j/7</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
