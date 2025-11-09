'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSignIn } from '@clerk/nextjs'
import { Eye, EyeOff, Loader2, Users, ShoppingCart, FileText } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) return

    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        // Handle MFA or other verification steps
        setError('Additional verification required')
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.errors?.[0]?.message || 'Invalid email or password')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-slate-800">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          {/* Animated shapes */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-overlay opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full mix-blend-overlay opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="bg-white p-4 rounded-2xl shadow-lg mb-8">
            <Image
              src="/logo.png"
              alt="Kadouri Connection"
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold mb-4">Kadouri Connection</h1>
          <p className="text-xl mb-8 text-center max-w-md opacity-90">
            Professional CRM
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mt-8">
            {/* Accounts */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Users className="h-6 w-6 mb-2 text-white/90" />
              <h3 className="text-sm font-semibold text-white mb-1">Accounts</h3>
              <p className="text-xs text-white/70">Manage business accounts and organizations</p>
            </div>

            {/* Orders */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <ShoppingCart className="h-6 w-6 mb-2 text-white/90" />
              <h3 className="text-sm font-semibold text-white mb-1">Orders</h3>
              <p className="text-xs text-white/70">Create and manage customer orders</p>
            </div>

            {/* Invoices */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <FileText className="h-6 w-6 mb-2 text-white/90" />
              <h3 className="text-sm font-semibold text-white mb-1">Invoices</h3>
              <p className="text-xs text-white/70">Generate and track invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/logo.png"
              alt="Kadouri Connection"
              width={64}
              height={64}
              className="w-16 h-16 object-contain mx-auto mb-4"
              priority
            />
            <h2 className="text-2xl font-bold text-gray-900">Kadouri Connection</h2>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-8">Sign in to your account to continue</p>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600 mt-8">
                Have an invitation code?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/accept-invitation?token=demo-token')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Accept invitation
                </button>
              </p>
            </form>

          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            © 2025 Kadouri Connection. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
