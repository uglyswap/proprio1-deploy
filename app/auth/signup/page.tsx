'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, CheckCircle2, Star, Zap, Shield, Clock } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organizationName: formData.organizationName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Redirect to signin
      router.push('/auth/signin?registered=true')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">ProprioFinder</span>
          </Link>
        </div>
      </nav>

      <div className="container py-8 md:py-16 px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Commencez gratuitement
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Rejoignez les centaines de professionnels qui trouvent leurs propriétaires en 30 secondes
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Essai gratuit 7 jours</h3>
                  <p className="text-gray-600 text-sm">
                    Testez toutes les fonctionnalités sans carte bancaire
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">50M+ propriétaires en base</h3>
                  <p className="text-gray-600 text-sm">
                    Accès immédiat à toute la France + enrichissement SIRENE
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">100% conforme RGPD</h3>
                  <p className="text-gray-600 text-sm">
                    Données publiques et sécurisées
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Résultats en 30 secondes</h3>
                  <p className="text-gray-600 text-sm">
                    Interface intuitive, résultats instantanés
                  </p>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="bg-white rounded-xl border-2 p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-3">
                "J'ai divisé par 10 mon temps de prospection. Un outil indispensable pour tout professionnel de l'immobilier."
              </p>
              <p className="text-sm font-semibold text-gray-900">Marie C.</p>
              <p className="text-sm text-gray-600">Agent immobilier, Paris</p>
            </div>
          </div>

          {/* Right side - Form */}
          <div>
            <Card className="border-2 shadow-xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-3xl font-bold text-center">
                  Créer un compte
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Commencez à utiliser ProprioFinder gratuitement
                </CardDescription>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Sans CB</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>7 jours gratuit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Sans engagement</span>
                  </div>
                </div>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jean Dupont"
                      className="h-11"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean@entreprise.com"
                      className="h-11"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Nom de l'organisation</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Mon Entreprise"
                      className="h-11"
                      value={formData.organizationName}
                      onChange={(e) =>
                        setFormData({ ...formData, organizationName: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 caractères
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Création...' : 'Créer mon compte gratuitement'}
                  </Button>

                  <div className="text-sm text-center text-muted-foreground">
                    Déjà un compte ?{' '}
                    <Link href="/auth/signin" className="text-primary hover:underline font-semibold">
                      Se connecter
                    </Link>
                  </div>

                  <p className="text-xs text-center text-muted-foreground px-4">
                    En créant un compte, vous acceptez nos{' '}
                    <Link href="#" className="underline">conditions d'utilisation</Link>
                    {' '}et notre{' '}
                    <Link href="#" className="underline">politique de confidentialité</Link>
                  </p>
                </CardFooter>
              </form>
            </Card>

            {/* Mobile social proof */}
            <div className="lg:hidden mt-8 bg-white rounded-xl border-2 p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-3">
                "J'ai divisé par 10 mon temps de prospection. Un outil indispensable pour tout professionnel de l'immobilier."
              </p>
              <p className="text-sm font-semibold text-gray-900">Marie C.</p>
              <p className="text-sm text-gray-600">Agent immobilier, Paris</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
