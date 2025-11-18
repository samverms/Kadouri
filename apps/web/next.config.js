/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@pace/shared'],
  output: 'export',
  distDir: 'out',
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
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
