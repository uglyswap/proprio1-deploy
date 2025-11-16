"use client"

import { useState } from 'react'
import { SuperAdminLayout } from '@/components/superadmin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function SuperAdminStripePage() {
  const [secretKey, setSecretKey] = useState('')
  const [publishableKey, setPublishableKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecrets, setShowSecrets] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const testConnection = async () => {
    setIsTesting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/superadmin/stripe/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey, publishableKey }),
      })

      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        setMessage({ type: 'success', text: '✅ Connexion Stripe réussie !' })
      } else {
        setIsConnected(false)
        setMessage({ type: 'error', text: data.error || 'Erreur de connexion' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur réseau' })
    } finally {
      setIsTesting(false)
    }
  }

  const saveConfiguration = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/superadmin/stripe/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey,
          publishableKey,
          webhookSecret,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Configuration Stripe enregistrée !' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur d\'enregistrement' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur réseau' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SuperAdminLayout>
      <div className="p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            Configuration Stripe
          </h1>
          <p className="text-gray-600 mt-1">
            Connectez votre compte Stripe pour accepter les paiements
          </p>
        </div>

        {/* Status */}
        {isConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Stripe est connecté et opérationnel
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Comment obtenir vos clés Stripe ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>
                Connectez-vous à{' '}
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  dashboard.stripe.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Allez dans "Développeurs" → "Clés API"</li>
              <li>Copiez votre clé secrète (commence par sk_test_ ou sk_live_)</li>
              <li>Copiez votre clé publiable (commence par pk_test_ ou pk_live_)</li>
              <li>
                Pour le webhook secret, allez dans "Développeurs" → "Webhooks" → "Ajouter un endpoint"
              </li>
              <li>URL du webhook : <code className="bg-gray-100 px-2 py-1 rounded">
                https://votre-domaine.com/api/webhooks/stripe
              </code></li>
              <li>Écoutez ces événements : checkout.session.completed, invoice.payment_succeeded, customer.subscription.*</li>
            </ol>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Clés API Stripe</CardTitle>
            <CardDescription>
              Ces informations sont chiffrées et stockées en sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Secret Key */}
              <div className="space-y-2">
                <Label htmlFor="secretKey">
                  Secret Key <Badge variant="outline">Chiffré</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="secretKey"
                    type={showSecrets ? 'text' : 'password'}
                    placeholder="sk_test_..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Publishable Key */}
              <div className="space-y-2">
                <Label htmlFor="publishableKey">Publishable Key</Label>
                <Input
                  id="publishableKey"
                  type="text"
                  placeholder="pk_test_..."
                  value={publishableKey}
                  onChange={(e) => setPublishableKey(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">
                  Webhook Secret <Badge variant="outline">Chiffré</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="webhookSecret"
                    type={showSecrets ? 'text' : 'password'}
                    placeholder="whsec_..."
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Nécessaire pour recevoir les événements de paiement
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={testConnection}
                disabled={!secretKey || !publishableKey || isTesting}
                variant="outline"
              >
                {isTesting ? 'Test en cours...' : 'Tester la connexion'}
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={!secretKey || !publishableKey || isSaving}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration du Webhook</CardTitle>
            <CardDescription>
              URL à configurer dans votre dashboard Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/stripe`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/stripe`)
                    setMessage({ type: 'success', text: '✅ URL copiée !' })
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Événements à écouter</Label>
              <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm font-mono">
                <div>✓ checkout.session.completed</div>
                <div>✓ invoice.payment_succeeded</div>
                <div>✓ customer.subscription.created</div>
                <div>✓ customer.subscription.updated</div>
                <div>✓ customer.subscription.deleted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
