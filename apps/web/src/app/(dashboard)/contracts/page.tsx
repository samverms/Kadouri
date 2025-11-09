'use client'

import { FileSignature } from 'lucide-react'

export default function ContractsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <FileSignature className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          </div>
          <p className="mt-2 text-gray-600">Manage your contracts and agreements</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Contract management coming soon...</p>
        </div>
      </div>
    </div>
  )
}
