'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useSignUp } from '@clerk/nextjs'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Eye, EyeOff, Loader2, CheckCircle2, Shield, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signUp, setActive } = useSignUp()
  const token = searchParams.get('token')

  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [invitationData, setInvitationData] = useState<{
    email: string
    role: string
    expiresAt: string
  } | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Validate invitation token
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValid(false)
        setIsValidating(false)
        return
      }

      try {
        const response = await axios.get(`${API_URL}/api/invitations/verify/${token}`)

        if (response.data.success) {
          setIsValid(true)
          setInvitationData(response.data.data)
        } else {
          setIsValid(false)
        }
      } catch (error: any) {
        console.error('Token validation error:', error)
        setIsValid(false)
        setError(error.response?.data?.message || 'Invalid or expired invitation')
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded || !invitationData) return

    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Create Clerk account
      const signUpResult = await signUp.create({
        emailAddress: invitationData.email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      })

      // Step 2: Complete the signup process
      if (signUpResult.status === 'complete') {
        await setActive({ session: signUpResult.createdSessionId })

        // Step 3: Call API to accept invitation and set role
        try {
          await axios.post(
            `${API_URL}/api/invitations/accept`,
            { token },
            {
              withCredentials: true,
              headers: {
                Authorization: `Bearer ${signUpResult.createdSessionId}`,
              },
            }
          )

          // Redirect to dashboard
          router.push('/dashboard')
        } catch (apiError: any) {
          console.error('Failed to accept invitation:', apiError)
          setError('Account created but role assignment failed. Please contact support.')
          setIsLoading(false)
        }
      } else {
        // Handle email verification if needed
        setError('Account created but verification required. Check your email.')
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.errors?.[0]?.message || 'Failed to create account. Please try again.')
      setIsLoading(false)
    }
  }

  const passwordStrength = (pwd: string) => {
    if (pwd.length < 6) return { strength: 0, label: 'Too short', color: 'bg-red-500' }
    if (pwd.length < 8) return { strength: 33, label: 'Weak', color: 'bg-orange-500' }
    if (pwd.length < 12) return { strength: 66, label: 'Good', color: 'bg-yellow-500' }
    return { strength: 100, label: 'Strong', color: 'bg-green-500' }
  }

  const strength = passwordStrength(password)

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-gray-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValid || !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mb-4 mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Invalid Invitation</CardTitle>
            <CardDescription className="text-gray-600">
              This invitation link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Invitation links expire after 7 days. Please contact your administrator to request a new
              invitation.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <Image
              src="/logo.png"
              alt="Kadouri Connection Logo"
              width={80}
              height={80}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Welcome to Kadouri Connection
          </h1>
          <p className="text-gray-600 mt-2">Complete your account setup</p>
        </div>

        {/* Invitation Info */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">You've been invited!</p>
                <p className="text-sm text-green-800 mt-1">
                  You've been invited to join as{' '}
                  <strong className="capitalize">{invitationData.role}</strong>
                </p>
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Email: {invitationData.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Card */}
        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Create Your Account</CardTitle>
            <CardDescription className="text-gray-600">
              Set up your profile and choose a secure password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccept} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={invitationData.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${strength.color}`}
                          style={{ width: `${strength.strength}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{strength.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <button type="button" className="text-blue-600 hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </button>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
