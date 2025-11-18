'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { showToast } = useToast()

  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    variety: '',
    grade: '',
    category: '',
    active: true,
  })

  // Category options
  const categories = [
    'Almonds', 'Walnuts', 'Pecans', 'Pistachios', 'Cashews', 'Hazelnuts',
    'Macadamias', 'Brazil Nuts', 'Pine Nuts',
    'Raisins', 'Dates', 'Figs', 'Prunes', 'Apricots', 'Cranberries', 'Cherries',
    'Pumpkin Seeds', 'Sunflower Seeds', 'Chia Seeds', 'Flax Seeds', 'Sesame Seeds',
    'Apples', 'Oranges', 'Grapes', 'Berries',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showToast('Product name is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        code: formData.code || undefined,
        name: formData.name,
        variety: formData.variety || undefined,
        grade: formData.grade || undefined,
        category: formData.category || undefined,
        active: formData.active,
      }

      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create product')
      }

      const newProduct = await response.json()
      showToast('Product created successfully', 'success')

      // Redirect to edit page to add variants
      router.push(`/products/${newProduct.id}/edit`)
    } catch (err: any) {
      console.error('Create product error:', err)
      showToast(err.message || 'Failed to create product', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/products')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">New Product</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Create a new product. You can add variants after creating the product.
        </p>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Product Code */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Code
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="K1001"
                  className="h-9"
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Almond Blanched Flour"
                  className="h-9"
                  required
                />
              </div>

              {/* Variety */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Variety
                </label>
                <Input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="NUTS, FRUITS, ORGANIC"
                  className="h-9"
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <Input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="A, Premium, Standard"
                  className="h-9"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}
