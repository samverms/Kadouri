'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Edit2, Trash2, Mail, Phone, Calendar, MapPin, Building2, CheckCircle2, XCircle } from 'lucide-react'
import type { Broker } from '@kadouri/shared'

export default function BrokerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  const { showToast } = useToast()

  const [broker, setBroker] = useState<Broker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBroker()
  }, [params.id])

  const fetchBroker = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/brokers/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch broker')

      const data = await response.json()
      setBroker(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      showToast('Failed to fetch broker', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this broker? This action cannot be undone.')) {
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/brokers/${params.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to delete broker')

      showToast('Broker deleted successfully', 'success')
      router.push('/settings/brokers')
    } catch (err) {
      showToast('Failed to delete broker', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">Loading broker...</CardContent>
        </Card>
      </div>
    )
  }

  if (error || !broker) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center text-destructive">
            {error || 'Broker not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/brokers">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Brokers
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/settings/brokers/${broker.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" className="gap-2" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{broker.name}</h1>
          {broker.active ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <XCircle className="h-3 w-3" />
              Inactive
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1">Broker Details</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="font-medium mt-1">{broker.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Company Name</label>
                {broker.companyName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{broker.companyName}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">-</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                {broker.email ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${broker.email}`}
                      className="font-medium hover:underline"
                    >
                      {broker.email}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">-</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                {broker.phone ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${broker.phone}`}
                      className="font-medium hover:underline"
                    >
                      {broker.phone}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">-</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(broker.addressLine1 || broker.city || broker.state || broker.postalCode || broker.country) && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="space-y-1">
                  {broker.addressLine1 && <p className="font-medium">{broker.addressLine1}</p>}
                  {broker.addressLine2 && <p className="font-medium">{broker.addressLine2}</p>}
                  {(broker.city || broker.state || broker.postalCode) && (
                    <p className="text-sm text-muted-foreground">
                      {[broker.city, broker.state, broker.postalCode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {broker.country && broker.country !== 'US' && (
                    <p className="text-sm text-muted-foreground">{broker.country}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Broker ID</label>
                <p className="font-mono text-sm mt-1">{broker.id}</p>
              </div>
              {broker.createdBy && (
                <div>
                  <label className="text-sm text-muted-foreground">Created By</label>
                  <p className="text-sm mt-1">{broker.createdBy}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {new Date(broker.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Last Updated</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {new Date(broker.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
