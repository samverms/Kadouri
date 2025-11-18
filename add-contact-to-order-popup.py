#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add email modal state
old_state = '''  const [accountOrders, setAccountOrders] = useState<{ [key: string]: any[] }>({})
  const [outstandingInvoices, setOutstandingInvoices] = useState<{ [key: string]: number }>({})
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null)'''

new_state = '''  const [accountOrders, setAccountOrders] = useState<{ [key: string]: any[] }>({})
  const [outstandingInvoices, setOutstandingInvoices] = useState<{ [key: string]: number }>({})
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState<{email: string, name: string} | null>(null)'''

content = content.replace(old_state, new_state)

# Add handler to open email modal
old_useeffect = '''  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenOrdersAccountId(null)
    }

    if (openOrdersAccountId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openOrdersAccountId])'''

new_useeffect = '''  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenOrdersAccountId(null)
    }

    if (openOrdersAccountId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openOrdersAccountId])

  const handleOpenEmailModal = (email: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEmailRecipient({ email, name })
    setShowEmailModal(true)
  }'''

content = content.replace(old_useeffect, new_useeffect)

# Update order popup to show phone and email with account contact info
old_order_popup_content = '''                                          <div className="text-xs text-gray-600 space-y-0.5">
                                            <div>Seller: {order.sellerAccountName}</div>
                                            <div>Buyer: {order.buyerAccountName}</div>'''

new_order_popup_content = '''                                          <div className="text-xs text-gray-600 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span>Seller: {order.sellerAccountName}</span>
                                              {(() => {
                                                const sellerAccount = accounts.find(a => a.id === order.sellerAccountId)
                                                const contact = sellerAccount?.contacts?.find(c => c.isPrimary) || sellerAccount?.contacts?.[0]
                                                return contact && (
                                                  <div className="flex items-center gap-1">
                                                    {contact.phone && (
                                                      <a
                                                        href={`tel:${contact.phone}`}
                                                        className="text-green-600 hover:text-green-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <Phone className="h-3 w-3" />
                                                      </a>
                                                    )}
                                                    {contact.email && (
                                                      <button
                                                        onClick={(e) => handleOpenEmailModal(contact.email, order.sellerAccountName, e)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                      >
                                                        <Mail className="h-3 w-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                )
                                              })()}
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span>Buyer: {order.buyerAccountName}</span>
                                              {(() => {
                                                const buyerAccount = accounts.find(a => a.id === order.buyerAccountId)
                                                const contact = buyerAccount?.contacts?.find(c => c.isPrimary) || buyerAccount?.contacts?.[0]
                                                return contact && (
                                                  <div className="flex items-center gap-1">
                                                    {contact.phone && (
                                                      <a
                                                        href={`tel:${contact.phone}`}
                                                        className="text-green-600 hover:text-green-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <Phone className="h-3 w-3" />
                                                      </a>
                                                    )}
                                                    {contact.email && (
                                                      <button
                                                        onClick={(e) => handleOpenEmailModal(contact.email, order.buyerAccountName, e)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                      >
                                                        <Mail className="h-3 w-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                )
                                              })()}
                                            </div>'''

content = content.replace(old_order_popup_content, new_order_popup_content)

# Add email modal at the end before closing div
old_closing = '''      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAccountCreated}
        />
      )}
    </div>
  )
}'''

new_closing = '''      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAccountCreated}
        />
      )}

      {/* Email Compose Modal */}
      {showEmailModal && emailRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Compose Email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                <div className="flex items-center gap-2 px-3 py-2 border rounded bg-gray-50">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{emailRecipient.name}</span>
                  <span className="text-sm text-gray-500">&lt;{emailRecipient.email}&gt;</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                <Input placeholder="Enter subject" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                <textarea
                  className="w-full h-48 px-3 py-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}'''

content = content.replace(old_closing, new_closing)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added phone and email icons to order popup with email compose modal")
