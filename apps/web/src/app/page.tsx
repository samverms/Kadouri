'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard for now (we'll add auth later)
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Kadouri CRM</h1>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
