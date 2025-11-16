import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Trouvez les propriétaires immobiliers en quelques clics
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Recherchez par adresse, par propriétaire ou par zone géographique.
              Obtenez les contacts et informations enrichies instantanément.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signin">Commencer gratuitement</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">Voir les tarifs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Fonctionnalités principales
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Recherche par adresse</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Trouvez tous les propriétaires d'un bien à une adresse donnée
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recherche par propriétaire</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Découvrez tous les biens d'un propriétaire spécifique
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recherche par zone</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Dessinez une zone sur la carte et obtenez tous les propriétaires
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Données enrichies</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Emails, téléphones, et liens vers Pappers, Cadastre, DVF
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Système de crédits</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Payez uniquement pour les résultats que vous validez
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Téléchargez vos résultats avec tous les liens enrichis
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl mb-8">
            Créez votre compte gratuitement et commencez vos recherches
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/auth/signin">Essayer maintenant</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
