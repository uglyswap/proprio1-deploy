'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, CheckCircle2, Zap, TrendingUp, Database } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const registered = searchParams.get('registered')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navbar */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-xl dark:text-white">ProprioFinder</span>
          </Link>
        </div>
      </nav>

      <div className="container py-8 md:py-16 px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Content de vous revoir !
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Accédez à votre dashboard et continuez à trouver vos propriétaires en un clic
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 dark:border-gray-700 p-4">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">50M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Biens en base</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 dark:border-gray-700 p-4">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">2.4M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Entreprises SIRENE</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 dark:border-gray-700 p-4">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Taux de réussite</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 dark:border-gray-700 p-4">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">30s</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Temps moyen</div>
              </div>
            </div>

            {/* Features reminder */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Recherche instantanée</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Par adresse, propriétaire ou zone</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Enrichissement automatique</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">SIRENE, Pappers, Cadastre, DVF</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Analytics avancé</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Suivez votre utilisation en temps réel</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div>
            <Card className="border-2 shadow-xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-3xl font-bold text-center">
                  Connexion
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Connectez-vous à votre compte ProprioFinder
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {registered && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Compte créé avec succès ! Vous pouvez maintenant vous connecter.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@entreprise.com"
                      className="h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      className="h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>

                  <div className="text-sm text-center text-muted-foreground">
                    Pas encore de compte ?{' '}
                    <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
                      Créer un compte gratuitement
                    </Link>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span>Essai gratuit 7 jours</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span>Sans carte bancaire</span>
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </form>
            </Card>

            {/* Mobile quick stats */}
            <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">50M+</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Biens en base</div>
              </div>
              <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl border-2 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">98%</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Taux de réussite</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
