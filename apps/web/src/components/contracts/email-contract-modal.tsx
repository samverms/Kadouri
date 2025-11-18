'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface Contract {
  id: string
  contractNumber: string
  seller: {
    id: string
    companyName: string
    email?: string
  }
  buyer: {
    id: string
    companyName: string
    email?: string
  }
  product: {
    id: string
    name: string
  }
  totalQuantity: string
  remainingQuantity: string
  unit: string
  pricePerUnit: string
  totalValue: string
  validFrom: string
  validUntil: string
  status: string
  executedDocumentUrl?: string
  draftDocumentUrl?: string
}

interface EmailContractModalProps {
  contract: Contract
  onClose: () => void
  onSuccess?: () => void
}

export function EmailContractModal({ contract, onClose, onSuccess }: EmailContractModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sendToSeller, setSendToSeller] = useState(true)
  const [sendToBuyer, setSendToBuyer] = useState(true)
  const [message, setMessage] = useState('')

  const handleSend = async () => {
    if (!sendToSeller && !sendToBuyer) {
      setError('Please select at least one recipient')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/contracts/${contract.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sendToSeller,
          sendToBuyer,
          message: message.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to send email')
      }

      const results = await res.json()

      if (onSuccess) {
        onSuccess()
      }

      // Show success and close after a brief delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Contract
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contract Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-700">Contract #{contract.contractNumber}</p>
            <p className="text-sm text-gray-600 mt-1">
              {contract.seller.companyName} → {contract.buyer.companyName}
            </p>
            <p className="text-sm text-gray-600">
              {contract.product.name} • {contract.totalQuantity} {contract.unit}
            </p>
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Send to:</Label>

            {/* Seller Checkbox - BLUE theme */}
            <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-blue-50 transition-colors"
                 style={{ borderColor: sendToSeller ? '#3b82f6' : '#e5e7eb' }}>
              <input
                type="checkbox"
                id="seller"
                checked={sendToSeller}
                onChange={(e) => setSendToSeller(e.target.checked)}
                disabled={!contract.seller.email || loading}
                className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="seller" className="flex items-center gap-2 cursor-pointer">
                  <span className="font-semibold text-gray-900">{contract.seller.companyName}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded">
                    SELLER
                  </span>
                </label>
                {contract.seller.email ? (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {contract.seller.email}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    No email on file
                  </p>
                )}
                {sendToSeller && (
                  <p className="text-xs text-blue-600 mt-2">
                    📧 Will receive blue-themed seller copy
                  </p>
                )}
              </div>
            </div>

            {/* Buyer Checkbox - GREEN theme */}
            <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-green-50 transition-colors"
                 style={{ borderColor: sendToBuyer ? '#22c55e' : '#e5e7eb' }}>
              <input
                type="checkbox"
                id="buyer"
                checked={sendToBuyer}
                onChange={(e) => setSendToBuyer(e.target.checked)}
                disabled={!contract.buyer.email || loading}
                className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <label htmlFor="buyer" className="flex items-center gap-2 cursor-pointer">
                  <span className="font-semibold text-gray-900">{contract.buyer.companyName}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold text-white bg-green-600 rounded">
                    BUYER
                  </span>
                </label>
                {contract.buyer.email ? (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {contract.buyer.email}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    No email on file
                  </p>
                )}
                {sendToBuyer && (
                  <p className="text-xs text-green-600 mt-2">
                    📧 Will receive green-themed buyer copy
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="message" className="text-base font-semibold">
              Add a message (optional)
            </Label>
            <textarea
              id="message"
              placeholder="Type a message to include in the email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={loading}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📎 <strong>Contract document will be attached</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {contract.executedDocumentUrl
                ? 'Executed (signed) contract will be sent'
                : 'Draft contract will be sent'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || (!contract.seller.email && !contract.buyer.email)}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
