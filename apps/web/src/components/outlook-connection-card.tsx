'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from './ui/button'
import { Loader2, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface OutlookStatus {
  connected: boolean
  email?: string
  expiresAt?: string
  isExpired?: boolean
}

export function OutlookConnectionCard() {
  const { getToken } = useAuth()
  const [status, setStatus] = useState<OutlookStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()

    // Listen for successful connection from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OUTLOOK_CONNECTED' && event.data?.success) {
        fetchStatus()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/outlook/status`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        setStatus({ connected: false })
      }
    } catch (error) {
      console.error('Failed to fetch Outlook status:', error)
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    const token = await getToken()
    const connectUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/outlook/connect`

    // Open in popup window
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    window.open(
      connectUrl,
      'Office 365 Connect',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Office 365 account?')) {
      return
    }

    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/outlook/disconnect`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        setStatus({ connected: false })
      } else {
        alert('Failed to disconnect from Office 365')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      alert('Failed to disconnect from Office 365')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Not Connected
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Connect your Office 365 account to send emails directly from Kadouri CRM.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <li>• Send emails using your own email address</li>
              <li>• Automatic token refresh</li>
              <li>• Secure OAuth 2.0 authentication</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleConnect} className="gap-2">
            <Mail className="h-4 w-4" />
            Connect Office 365
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-3 rounded-lg border p-4 ${
        status.isExpired
          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20'
          : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
      }`}>
        {status.isExpired ? (
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${
            status.isExpired
              ? 'text-yellow-900 dark:text-yellow-100'
              : 'text-green-900 dark:text-green-100'
          }`}>
            {status.isExpired ? 'Token Expired' : 'Connected'}
          </h4>
          <p className={`text-sm mt-1 ${
            status.isExpired
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-green-700 dark:text-green-300'
          }`}>
            <strong>Account:</strong> {status.email}
          </p>
          {status.expiresAt && (
            <p className={`text-xs mt-1 ${
              status.isExpired
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {status.isExpired
                ? `Expired on ${new Date(status.expiresAt).toLocaleDateString()}`
                : `Expires on ${new Date(status.expiresAt).toLocaleDateString()}`
              }
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {status.isExpired && (
          <Button onClick={handleConnect} variant="outline" className="gap-2">
            Reconnect
          </Button>
        )}
        <Button onClick={handleDisconnect} variant="destructive" className="gap-2">
          <XCircle className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    </div>
  )
}
