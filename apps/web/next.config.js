/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@kadouri/shared'],
  images: {
    unoptimized: true,
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  typescript: {
    // Only disable type checking on Heroku - keep enabled for local development
    ignoreBuildErrors: process.env.NODE_ENV === 'production' && process.env.HEROKU === 'true',
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ],
      afterFiles: [
        // Rewrite /help paths without file extensions to serve index.html
        {
          source: '/help',
          destination: '/help/index.html',
        },
        {
          source: '/help/:path((?!.*\\.).*)',
          destination: '/help/:path/index.html',
        },
      ],
    }
  },
}

module.exports = nextConfig
