import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://propriofinder.com'),
  title: {
    default: 'ProprioFinder - Trouvez n\'importe quel propriétaire en France en 30 secondes',
    template: '%s | ProprioFinder',
  },
  description: 'Accédez instantanément aux coordonnées de 50+ millions de propriétaires immobiliers en France. Emails vérifiés, téléphones, données SIRENE enrichies. Plans dès 29€/mois.',
  keywords: [
    'propriétaire immobilier',
    'recherche propriétaire',
    'base de données immobilière',
    'SIRENE',
    'cadastre',
    'fichiers fonciers',
    'prospection immobilière',
    'crm immobilier',
  ],
  authors: [{ name: 'ProprioFinder' }],
  creator: 'ProprioFinder',
  publisher: 'ProprioFinder',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    title: 'ProprioFinder - Trouvez n\'importe quel propriétaire en France',
    description: 'Accédez instantanément aux coordonnées de 50+ millions de propriétaires. Emails vérifiés, téléphones, données SIRENE.',
    siteName: 'ProprioFinder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProprioFinder - Trouvez les propriétaires immobiliers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProprioFinder - Trouvez n\'importe quel propriétaire en France',
    description: '50+ millions de propriétaires • Emails vérifiés • Données SIRENE • Dès 29€/mois',
    images: ['/og-image.png'],
    creator: '@propriofinder',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        {/* Structured Data - Organization */}
        <Script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'ProprioFinder',
              description: 'Plateforme SaaS pour trouver les propriétaires immobiliers en France',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://propriofinder.com',
              logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://propriofinder.com'}/logo.png`,
              sameAs: [
                'https://twitter.com/propriofinder',
                'https://linkedin.com/company/propriofinder',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                availableLanguage: ['French'],
              },
            }),
          }}
        />

        {/* Structured Data - SoftwareApplication */}
        <Script
          id="structured-data-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ProprioFinder',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '29',
                highPrice: '349',
                priceCurrency: 'EUR',
                priceSpecification: [
                  {
                    '@type': 'UnitPriceSpecification',
                    price: '29',
                    priceCurrency: 'EUR',
                    name: 'Plan Basic',
                  },
                  {
                    '@type': 'UnitPriceSpecification',
                    price: '99',
                    priceCurrency: 'EUR',
                    name: 'Plan Pro',
                  },
                  {
                    '@type': 'UnitPriceSpecification',
                    price: '349',
                    priceCurrency: 'EUR',
                    name: 'Plan Enterprise',
                  },
                ],
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '127',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
