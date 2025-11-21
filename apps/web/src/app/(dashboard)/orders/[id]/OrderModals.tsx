'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrderModalsProps {
  // Add Address Modal
  showAddAddressModal: boolean
  setShowAddAddressModal: (show: boolean) => void
  modalAccountType: 'seller' | 'buyer'
  newAddress: {
    type: string
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    country: string
    isPrimary: boolean
  }
  setNewAddress: (address: any) => void
  handleAddAddress: () => void

  // Add Contact Modal
  showAddContactModal: boolean
  setShowAddContactModal: (show: boolean) => void
  newContact: {
    name: string
    email: string
    phone: string
    isPrimary: boolean
  }
  setNewContact: (contact: any) => void
  handleAddContact: () => void

  // Add Agent Modal
  showAddAgentModal: boolean
  setShowAddAgentModal: (show: boolean) => void
  newUser: {
    name: string
    email: string
    phone: string
  }
  setNewUser: (user: any) => void
  handleAddAgent: () => void

  // Add Broker Modal
  showAddBrokerModal: boolean
  setShowAddBrokerModal: (show: boolean) => void
  handleAddBroker: () => void
}

export function OrderModals({
  showAddAddressModal,
  setShowAddAddressModal,
  modalAccountType,
  newAddress,
  setNewAddress,
  handleAddAddress,
  showAddContactModal,
  setShowAddContactModal,
  newContact,
  setNewContact,
  handleAddContact,
  showAddAgentModal,
  setShowAddAgentModal,
  newUser,
  setNewUser,
  handleAddAgent,
  showAddBrokerModal,
  setShowAddBrokerModal,
  handleAddBroker,
}: OrderModalsProps) {
  return (
    <>
      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Add New Address for {modalAccountType === 'seller' ? 'Seller' : 'Buyer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Address Type *</Label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
                    value={newAddress.type}
                    onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                  >
                    <option value="billing">Billing</option>
                    <option value="shipping">Shipping</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>

                <div>
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    placeholder="123 Main St"
                    required
                  />
                </div>

                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                    placeholder="Suite 100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Los Angeles"
                      required
                    />
                  </div>

                  <div>
                    <Label>State *</Label>
                    <Input
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                      placeholder="CA"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Postal Code *</Label>
                    <Input
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="90001"
                      required
                    />
                  </div>

                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value.toUpperCase() })}
                      placeholder="US"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryAddress"
                    checked={newAddress.isPrimary}
                    onChange={(e) => setNewAddress({ ...newAddress, isPrimary: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor="isPrimaryAddress" className="cursor-pointer">Set as primary address</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddAddressModal(false)
                      setNewAddress({
                        type: 'billing',
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        country: 'US',
                        isPrimary: false,
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddAddress}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Address
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Add New Contact for {modalAccountType === 'seller' ? 'Seller' : 'Buyer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryContact"
                    checked={newContact.isPrimary}
                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <Label htmlFor="isPrimaryContact" className="cursor-pointer">Set as primary contact</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddContactModal(false)
                      setNewContact({
                        name: '',
                        email: '',
                        phone: '',
                        isPrimary: false,
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddContact}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Contact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddAgentModal(false)
                      setNewUser({
                        name: '',
                        email: '',
                        phone: '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddAgent}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Agent
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Broker Modal */}
      {showAddBrokerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Broker</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddBrokerModal(false)
                      setNewUser({
                        name: '',
                        email: '',
                        phone: '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddBroker}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Broker
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
