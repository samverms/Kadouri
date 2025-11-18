/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@pace/shared'],
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
}

module.exports = nextConfig
