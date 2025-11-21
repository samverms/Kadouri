'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

interface PaymentTerm {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PaymentTermsPage() {
  const { getToken } = useAuth()
  const [terms, setTerms] = useState<PaymentTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', isActive: true })
  const [isAdding, setIsAdding] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', description: '', isActive: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTerms()
  }, [])

  const fetchTerms = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/api/terms-options/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setTerms(data)
    } catch (error) {
      console.error('Failed to fetch payment terms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      alert('Name is required')
      return
    }

    try {
      setSaving(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/api/terms-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      })

      if (response.ok) {
        await fetchTerms()
        setAddForm({ name: '', description: '', isActive: true })
        setIsAdding(false)
      } else {
        alert('Failed to create payment term')
      }
    } catch (error) {
      console.error('Failed to create payment term:', error)
      alert('Failed to create payment term')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (term: PaymentTerm) => {
    setEditingId(term.id)
    setEditForm({ name: term.name, description: term.description || '', isActive: term.isActive })
  }

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim()) {
      alert('Name is required')
      return
    }

    try {
      setSaving(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/api/terms-options/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await fetchTerms()
        setEditingId(null)
      } else {
        alert('Failed to update payment term')
      }
    } catch (error) {
      console.error('Failed to update payment term:', error)
      alert('Failed to update payment term')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/api/terms-options/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchTerms()
      } else {
        alert('Failed to delete payment term')
      }
    } catch (error) {
      console.error('Failed to delete payment term:', error)
      alert('Failed to delete payment term')
    }
  }

  const handleToggleActive = async (term: PaymentTerm) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/api/terms-options/${term.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !term.isActive })
      })

      if (response.ok) {
        await fetchTerms()
      } else {
        alert('Failed to update payment term')
      }
    } catch (error) {
      console.error('Failed to update payment term:', error)
      alert('Failed to update payment term')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Payment Terms</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Manage payment terms for orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Terms List</CardTitle>
              <CardDescription>Add, edit, or remove payment terms</CardDescription>
            </div>
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="mr-2 h-4 w-4" />
              Add Term
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Form */}
              {isAdding && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Add New Payment Term</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="add-name">Name *</Label>
                      <Input
                        id="add-name"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        placeholder="e.g., Net 30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-description">Description</Label>
                      <Input
                        id="add-description"
                        value={addForm.description}
                        onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                        placeholder="e.g., Payment due within 30 days"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="add-active"
                      checked={addForm.isActive}
                      onChange={(e) => setAddForm({ ...addForm, isActive: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="add-active">Active</Label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleAdd} size="sm" disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Save
                    </Button>
                    <Button onClick={() => {
                      setIsAdding(false)
                      setAddForm({ name: '', description: '', isActive: true })
                    }} variant="outline" size="sm" disabled={saving}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Terms List */}
              {terms.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No payment terms found. Click "Add Term" to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      className={`rounded-lg border p-4 ${
                        editingId === term.id
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {editingId === term.id ? (
                        <div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name *</Label>
                              <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Input
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="edit-active"
                              checked={editForm.isActive}
                              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="edit-active">Active</Label>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button onClick={() => handleUpdate(term.id)} size="sm" disabled={saving}>
                              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                              Save
                            </Button>
                            <Button onClick={() => setEditingId(null)} variant="outline" size="sm" disabled={saving}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{term.name}</h3>
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  term.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                {term.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {term.description && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{term.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleToggleActive(term)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              {term.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button onClick={() => handleEdit(term)} variant="outline" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(term.id, term.name)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
