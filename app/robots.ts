import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://propriofinder.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/superadmin/',
          '/api/',
          '/auth/error',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
