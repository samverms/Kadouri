'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Edit2, Trash2, Mail, Phone, Calendar, MapPin, Building2, CheckCircle2, XCircle } from 'lucide-react'
import type { Agent } from '@kadouri/shared'

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  const { showToast } = useToast()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAgent()
  }, [params.id])

  const fetchAgent = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch agent')

      const data = await response.json()
      setAgent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      showToast('Failed to fetch agent', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/${params.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to delete agent')

      showToast('Agent deleted successfully', 'success')
      router.push('/settings/agents')
    } catch (err) {
      showToast('Failed to delete agent', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">Loading agent...</CardContent>
        </Card>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center text-destructive">
            {error || 'Agent not found'}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/agents">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/settings/agents/${agent.id}/edit`}>
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
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          {agent.active ? (
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
        <p className="text-muted-foreground mt-1">Agent Details</p>
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
                <p className="font-medium mt-1">{agent.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Company Name</label>
                {agent.companyName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{agent.companyName}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">-</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                {agent.email ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${agent.email}`}
                      className="font-medium hover:underline"
                    >
                      {agent.email}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">-</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                {agent.phone ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${agent.phone}`}
                      className="font-medium hover:underline"
                    >
                      {agent.phone}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">-</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(agent.addressLine1 || agent.city || agent.state || agent.postalCode || agent.country) && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="space-y-1">
                  {agent.addressLine1 && <p className="font-medium">{agent.addressLine1}</p>}
                  {agent.addressLine2 && <p className="font-medium">{agent.addressLine2}</p>}
                  {(agent.city || agent.state || agent.postalCode) && (
                    <p className="text-sm text-muted-foreground">
                      {[agent.city, agent.state, agent.postalCode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {agent.country && agent.country !== 'US' && (
                    <p className="text-sm text-muted-foreground">{agent.country}</p>
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
                <label className="text-sm text-muted-foreground">Agent ID</label>
                <p className="font-mono text-sm mt-1">{agent.id}</p>
              </div>
              {agent.createdBy && (
                <div>
                  <label className="text-sm text-muted-foreground">Created By</label>
                  <p className="text-sm mt-1">{agent.createdBy}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {new Date(agent.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Last Updated</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {new Date(agent.updatedAt).toLocaleString()}
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
