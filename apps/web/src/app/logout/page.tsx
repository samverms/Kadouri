'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useClerk } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2, CheckCircle2 } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()
  const { signOut } = useClerk()
  const [isLoggingOut, setIsLoggingOut] = useState(true)

  useEffect(() => {
    // Perform logout
    setTimeout(async () => {
      await signOut()
      setIsLoggingOut(false)
    }, 1500)
  }, [signOut])

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-gray-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Signing you out...</h2>
            <p className="text-gray-600">Please wait while we securely log you out</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">You've been signed out</h1>
          <p className="text-gray-600 mt-2">Come back soon!</p>
        </div>

        {/* Success Card */}
        <Card className="border-gray-200 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Successfully Signed Out</h2>
              <p className="text-gray-600">Your session has been securely ended. All your data is safe.</p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In Again
              </Button>

              <Button variant="outline" onClick={() => window.close()} className="w-full border-gray-300">
                Close Window
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Security Tips</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Always sign out when using shared computers</li>
            <li>• Keep your password secure and don't share it</li>
            <li>• Enable two-factor authentication for extra security</li>
            <li>• Report any suspicious activity to your administrator</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Kadouri Connection. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
