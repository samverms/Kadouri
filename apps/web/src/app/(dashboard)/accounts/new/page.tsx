'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, ArrowLeft, Save, User, MapPin } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  isPrimary: boolean
}

interface Address {
  id: string
  type: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  isPrimary: boolean
}

export default function NewAccountPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Account fields
  const [accountName, setAccountName] = useState('')
  const [accountCode, setAccountCode] = useState('')
  const [active, setActive] = useState(true)

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: '', email: '', phone: '', isPrimary: true },
  ])

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      type: 'billing',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      isPrimary: true,
    },
  ])

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        id: Date.now().toString(),
        name: '',
        email: '',
        phone: '',
        isPrimary: false,
      },
    ])
  }

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((c) => c.id !== id))
    }
  }

  const updateContact = (id: string, field: keyof Contact, value: any) => {
    setContacts(
      contacts.map((c) => {
        if (c.id === id) {
          // If setting isPrimary to true, set all others to false
          if (field === 'isPrimary' && value === true) {
            return { ...c, [field]: value }
          }
          return { ...c, [field]: value }
        }
        // If setting isPrimary to true, set all others to false
        if (field === 'isPrimary' && value === true) {
          return { ...c, isPrimary: false }
        }
        return c
      })
    )
  }

  const addAddress = () => {
    setAddresses([
      ...addresses,
      {
        id: Date.now().toString(),
        type: 'shipping',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        isPrimary: false,
      },
    ])
  }

  const removeAddress = (id: string) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((a) => a.id !== id))
    }
  }

  const updateAddress = (id: string, field: keyof Address, value: any) => {
    setAddresses(
      addresses.map((a) => {
        if (a.id === id) {
          // If setting isPrimary to true, set all others to false
          if (field === 'isPrimary' && value === true) {
            return { ...a, [field]: value }
          }
          return { ...a, [field]: value }
        }
        // If setting isPrimary to true, set all others to false
        if (field === 'isPrimary' && value === true) {
          return { ...a, isPrimary: false }
        }
        return a
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validation
      if (!accountName.trim()) {
        throw new Error('Account name is required')
      }

      // Check if at least one contact has email
      const validContacts = contacts.filter((c) => c.email.trim())
      if (validContacts.length === 0) {
        throw new Error('At least one contact with email is required')
      }

      const payload = {
        code: accountCode.trim() || undefined,
        name: accountName.trim(),
        active,
        contacts: validContacts.map((c) => ({
          name: c.name.trim(),
          email: c.email.trim(),
          phone: c.phone.trim() || undefined,
          isPrimary: c.isPrimary,
        })),
        addresses: addresses
          .filter((a) => a.line1.trim() && a.city.trim())
          .map((a) => ({
            type: a.type,
            line1: a.line1.trim(),
            line2: a.line2.trim() || undefined,
            city: a.city.trim(),
            state: a.state.trim(),
            postalCode: a.postalCode.trim(),
            country: a.country,
            isPrimary: a.isPrimary,
          })),
      }

      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create account')
      }

      const data = await response.json()
      router.push(`/accounts/${data.id}`)
    } catch (err: any) {
      console.error('Create account error:', err)
      setError(err.message || 'Failed to create account')
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/accounts')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Create New Account</h1>
        <p className="mt-2 text-gray-600">Add a new customer or seller account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Code
                </label>
                <Input
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  placeholder="Auto-generated if left blank"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to auto-generate from name
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Active Account
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacts
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addContact}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Contact {index + 1}</h4>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeContact(contact.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`primary-contact-${contact.id}`}
                    checked={contact.isPrimary}
                    onChange={(e) =>
                      updateContact(contact.id, 'isPrimary', e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`primary-contact-${contact.id}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    Primary Contact
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addAddress}>
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.map((address, index) => (
              <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Address {index + 1}</h4>
                  {addresses.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAddress(address.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <select
                      value={address.type}
                      onChange={(e) => updateAddress(address.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="billing">Billing</option>
                      <option value="shipping">Shipping</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <Input
                      value={address.line1}
                      onChange={(e) => updateAddress(address.id, 'line1', e.target.value)}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <Input
                      value={address.line2}
                      onChange={(e) => updateAddress(address.id, 'line2', e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <Input
                        value={address.city}
                        onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <Input
                        value={address.state}
                        onChange={(e) =>
                          updateAddress(address.id, 'state', e.target.value.toUpperCase())
                        }
                        placeholder="CA"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <Input
                        value={address.postalCode}
                        onChange={(e) =>
                          updateAddress(address.id, 'postalCode', e.target.value)
                        }
                        placeholder="94102"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`primary-address-${address.id}`}
                      checked={address.isPrimary}
                      onChange={(e) =>
                        updateAddress(address.id, 'isPrimary', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`primary-address-${address.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      Primary Address
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/accounts')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
