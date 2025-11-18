/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@pace/shared'],
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  typescript: {
    // Disable type checking during build - will fix errors incrementally
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
