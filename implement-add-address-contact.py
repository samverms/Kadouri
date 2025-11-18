#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for form data after the existing state declarations
old_state = '''  const [account, setAccount] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')'''

new_state = '''  const [account, setAccount] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [addressFormData, setAddressFormData] = useState({
    type: 'billing',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    isPrimary: false,
  })
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isPrimary: false,
  })
  const [formSubmitting, setFormSubmitting] = useState(false)'''

content = content.replace(old_state, new_state)

# Add handleAddAddress function after fetchAccountData
fetch_function_end = '''    } finally {
      setIsLoading(false)
    }
  }

  const addresses = account?.addresses || []'''

new_functions = '''    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await fetch(`http://localhost:2000/api/accounts/${accountId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addressFormData),
      })

      if (!response.ok) {
        throw new Error('Failed to add address')
      }

      // Refresh account data
      await fetchAccountData()

      // Reset form and close
      setAddressFormData({
        type: 'billing',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        isPrimary: false,
      })
      setShowAddressForm(false)
    } catch (err) {
      console.error('Add address error:', err)
      alert('Failed to add address')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await fetch(`http://localhost:2000/api/accounts/${accountId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(contactFormData),
      })

      if (!response.ok) {
        throw new Error('Failed to add contact')
      }

      // Refresh account data
      await fetchAccountData()

      // Reset form and close
      setContactFormData({
        name: '',
        email: '',
        phone: '',
        isPrimary: false,
      })
      setShowContactForm(false)
    } catch (err) {
      console.error('Add contact error:', err)
      alert('Failed to add contact')
    } finally {
      setFormSubmitting(false)
    }
  }

  const addresses = account?.addresses || []'''

content = content.replace(fetch_function_end, new_functions)

# Update the address form to use the handler and state
old_address_form = '''              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Type <span className="text-red-500">*</span>
                      </label>
                      <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="Street address" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <Input placeholder="Suite, unit, building, floor, etc." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input maxLength={2} placeholder="CA" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <Input placeholder="95814" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Add Address
                    </Button>'''

new_address_form = '''              <CardContent>
                <form className="space-y-4" onSubmit={handleAddAddress}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={addressFormData.type}
                        onChange={(e) => setAddressFormData({...addressFormData, type: e.target.value})}
                      >
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={addressFormData.isPrimary}
                          onChange={(e) => setAddressFormData({...addressFormData, isPrimary: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Street address"
                      value={addressFormData.line1}
                      onChange={(e) => setAddressFormData({...addressFormData, line1: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <Input
                      placeholder="Suite, unit, building, floor, etc."
                      value={addressFormData.line2}
                      onChange={(e) => setAddressFormData({...addressFormData, line2: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({...addressFormData, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        maxLength={2}
                        placeholder="CA"
                        value={addressFormData.state}
                        onChange={(e) => setAddressFormData({...addressFormData, state: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="95814"
                        value={addressFormData.postalCode}
                        onChange={(e) => setAddressFormData({...addressFormData, postalCode: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                      {formSubmitting ? 'Adding...' : 'Add Address'}
                    </Button>'''

content = content.replace(old_address_form, new_address_form)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Implemented Add Address functionality with API integration")
