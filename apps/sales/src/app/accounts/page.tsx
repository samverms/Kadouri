'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2, MapPin, User, ExternalLink, ChevronRight, ChevronDown, Mail, Phone } from 'lucide-react'

interface Account {
  id: string
  code: string
  name: string
  qboCustomerId?: string
  active: boolean
  createdAt: string
  addresses: Address[]
  contacts: Contact[]
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)

  // Mock data - will be replaced with API call
  const [accounts] = useState<Account[]>([
    {
      id: '1',
      code: 'ANC001',
      name: 'ANC001',
      active: true,
      createdAt: '2025-01-15',
      addresses: [
        {
          id: '1',
          type: 'mailing',
          line1: 'P.O. Box 1117',
          city: 'Hollister',
          state: 'CA',
          postalCode: '95024',
          isPrimary: false,
        },
      ],
      contacts: [
        {
          id: '1',
          name: 'Michel Steen',
          email: 'petite@unemail.com',
          isPrimary: false,
        },
        {
          id: '2',
          name: 'Another Contact',
          email: 'contact@email.com',
          isPrimary: false,
        },
      ],
    },
    {
      id: '2',
      code: 'CEN001',
      name: 'C&G ENTERPRISES',
      active: true,
      createdAt: '2025-01-18',
      addresses: [
        {
          id: '1',
          type: 'mailing',
          line1: '123 Business St',
          city: 'Sacramento',
          state: 'CA',
          postalCode: '95814',
          isPrimary: true,
        },
      ],
      contacts: [
        {
          id: '1',
          name: 'Steve',
          email: 'Steve@clovernominal.com',
          isPrimary: true,
        },
      ],
    },
    {
      id: '3',
      code: 'FAM001',
      name: 'FAMOSO NUT COMPANY',
      active: true,
      createdAt: '2025-01-20',
      addresses: [],
      contacts: [
        {
          id: '1',
          name: 'Wendi Haggard',
          email: 'wendi@famoso.com',
          isPrimary: true,
        },
      ],
    },
    {
      id: '4',
      code: 'GNC001',
      name: 'Guerra Nut Shelling',
      active: true,
      createdAt: '2025-01-21',
      addresses: [
        {
          id: '1',
          type: 'Mailing',
          line1: 'P.O. Box 1117',
          city: 'Hollister',
          state: 'CA',
          postalCode: '95024',
          isPrimary: false,
        },
        {
          id: '2',
          type: 'Physical',
          line1: '190 Hillcrest Rd.',
          city: 'Hollister',
          state: 'CA',
          postalCode: '95024',
          isPrimary: false,
        },
      ],
      contacts: [
        {
          id: '1',
          name: 'Jeff Guerra',
          email: 'Jeff@guerranut.com',
          phone: '831-637-4471',
          isPrimary: true,
        },
      ],
    },
  ])

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
          onClick={() => setShowCreateDialog(true)}
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

      {/* Create Account Dialog */}
      {showCreateDialog && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="e.g., Fresh Valley Farms" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Code
                  </label>
                  <Input placeholder="Auto-generated if left blank" />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to auto-generate from name
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts Table */}
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
                    Addresses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredAccounts.map((account) => (
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
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {account.code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/accounts/${account.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {account.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.addresses.length} address{account.addresses.length !== 1 ? 'es' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {account.contacts.length} contact{account.contacts.length !== 1 ? 's' : ''}
                        </div>
                        {account.contacts.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {account.contacts[0].name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="outline" size="sm" className="mr-2">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Delete
                        </Button>
                      </td>
                    </tr>
                    {expandedAccountId === account.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Addresses */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Addresses:
                              </h4>
                              {account.addresses.length > 0 ? (
                                <div className="space-y-3">
                                  {account.addresses.map((address) => (
                                    <div
                                      key={address.id}
                                      className="bg-white rounded-lg p-3 border border-gray-200"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm font-medium text-gray-900 capitalize">
                                            {address.type}
                                          </span>
                                        </div>
                                        {address.isPrimary && (
                                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 space-y-0.5">
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
                                <p className="text-sm text-gray-500">0 addresses</p>
                              )}
                            </div>

                            {/* Contacts */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Contacts:
                              </h4>
                              {account.contacts.length > 0 ? (
                                <div className="space-y-3">
                                  {account.contacts.map((contact) => (
                                    <div
                                      key={contact.id}
                                      className="bg-white rounded-lg p-3 border border-gray-200"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm font-medium text-gray-900">
                                            {contact.name}
                                          </span>
                                        </div>
                                        {contact.isPrimary && (
                                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Mail className="h-3 w-3" />
                                          <a
                                            href={`mailto:${contact.email}`}
                                            className="hover:text-blue-600"
                                          >
                                            {contact.email}
                                          </a>
                                        </div>
                                        {contact.phone && (
                                          <div className="flex items-center gap-2 text-sm text-gray-600">
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAccounts.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new account'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
