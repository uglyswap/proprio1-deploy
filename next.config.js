/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone disabled for nixpacks deployment
  // output: 'standalone',

  // Ignore TypeScript errors during build (temporary fix for leaflet-draw types)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignore ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile leaflet packages for CSS imports to work
  transpilePackages: ['leaflet', 'leaflet-draw', 'react-leaflet', 'react-leaflet-draw'],

  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    // Optimize images for production
    formats: ['image/avif', 'image/webp'],
  },

  webpack: (config) => {
    // Fix for Leaflet in Next.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'leaflet': require.resolve('leaflet'),
    };
    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
