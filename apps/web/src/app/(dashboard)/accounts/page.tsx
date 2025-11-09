'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChevronRight, ChevronDown, Mail, Phone, MapPin, User, Building2 } from 'lucide-react'
import { CreateAccountModal } from '@/components/accounts/create-account-modal'

interface Account {
  id: string
  code: string
  name: string
  qboCustomerId?: string
  active: boolean
  createdAt: string
  addresses?: Address[]
  contacts?: Contact[]
}

interface Address {
  id: string
  type: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  isPrimary: boolean
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  isPrimary: boolean
}

export default function AccountsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:3001/api/accounts', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data)
    } catch (err) {
      console.error('Fetch accounts error:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountCreated = (newAccount: Account) => {
    setAccounts([newAccount, ...accounts])
    setShowCreateModal(false)
  }

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-2 text-gray-600">Manage customer and seller accounts</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search accounts by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      )}

      {/* Accounts Table */}
      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Addresses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredAccounts.map((account) => {
                    const primaryContact = account.contacts?.find((c) => c.isPrimary) || account.contacts?.[0]
                    return (
                      <>
                        <tr
                          key={account.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                setExpandedAccountId(
                                  expandedAccountId === account.id ? null : account.id
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedAccountId === account.id ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            >
                              {account.code}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            {primaryContact ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{primaryContact.name}</div>
                                <div className="text-gray-500">{primaryContact.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No contact</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.addresses?.length || 0} address{account.addresses?.length !== 1 ? 'es' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                account.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {account.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/accounts/${account.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                        {expandedAccountId === account.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Contacts */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Contacts ({account.contacts?.length || 0})
                                  </h4>
                                  {account.contacts && account.contacts.length > 0 ? (
                                    <div className="space-y-2">
                                      {account.contacts.map((contact) => (
                                        <div
                                          key={contact.id}
                                          className="bg-white rounded-lg p-3 border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                              {contact.name}
                                            </span>
                                            {contact.isPrimary && (
                                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                Primary
                                              </span>
                                            )}
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                              <Mail className="h-3 w-3" />
                                              <a
                                                href={`mailto:${contact.email}`}
                                                className="hover:text-blue-600"
                                              >
                                                {contact.email}
                                              </a>
                                            </div>
                                            {contact.phone && (
                                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Phone className="h-3 w-3" />
                                                <a
                                                  href={`tel:${contact.phone}`}
                                                  className="hover:text-blue-600"
                                                >
                                                  {contact.phone}
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No contacts</p>
                                  )}
                                </div>

                                {/* Addresses */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Addresses ({account.addresses?.length || 0})
                                  </h4>
                                  {account.addresses && account.addresses.length > 0 ? (
                                    <div className="space-y-2">
                                      {account.addresses.map((address) => (
                                        <div
                                          key={address.id}
                                          className="bg-white rounded-lg p-3 border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900 capitalize">
                                              {address.type}
                                            </span>
                                            {address.isPrimary && (
                                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                Primary
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-600 space-y-0.5">
                                            <p>{address.line1}</p>
                                            {address.line2 && <p>{address.line2}</p>}
                                            <p>
                                              {address.city}, {address.state} {address.postalCode}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No addresses</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredAccounts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Get started by creating a new account'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAccountCreated}
        />
      )}
    </div>
  )
}
