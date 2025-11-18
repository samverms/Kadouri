'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, X, Plus, Edit2, Trash2, Star } from 'lucide-react'

interface Product {
  id: string
  code?: string
  name: string
  variety?: string
  grade?: string
  defaultUnitSize?: string
  uom: string
  active: boolean
  source?: string
  qboItemId?: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
  variants?: ProductVariant[]
}

interface ProductVariant {
  id: string
  productId: string
  sku?: string
  size: string
  sizeUnit: string
  packageType: string
  isDefault: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { showToast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

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

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantForm, setVariantForm] = useState({
    sku: '',
    size: '',
    sizeUnit: 'lb',
    packageType: 'bag',
    isDefault: false,
    active: true,
  })

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      setProduct(data)

      // Populate form with current data
      setFormData({
        code: data.code || '',
        name: data.name || '',
        variety: data.variety || '',
        grade: data.grade || '',
        category: data.category || '',
        active: data.active !== undefined ? data.active : true,
      })

      // Populate variants
      if (data.variants) {
        setVariants(data.variants)
      }
    } catch (err) {
      console.error('Fetch product error:', err)
      setError('Failed to load product')
      showToast('Failed to load product', 'error')
    } finally {
      setIsLoading(false)
    }
  }

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update product')
      }

      showToast('Product updated successfully', 'success')
      router.push(`/products/${productId}`)
    } catch (err: any) {
      console.error('Update product error:', err)
      showToast(err.message || 'Failed to update product', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/products/${productId}`)
  }

  // Variant management functions
  const handleAddVariant = () => {
    setEditingVariant(null)
    setVariantForm({
      sku: '',
      size: '',
      sizeUnit: 'lb',
      packageType: 'bag',
      isDefault: false,
      active: true,
    })
    setShowVariantForm(true)
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setVariantForm({
      sku: variant.sku || '',
      size: variant.size,
      sizeUnit: variant.sizeUnit,
      packageType: variant.packageType,
      isDefault: variant.isDefault,
      active: variant.active,
    })
    setShowVariantForm(true)
  }

  const handleSaveVariant = async () => {
    if (!variantForm.size || parseFloat(variantForm.size) <= 0) {
      showToast('Size must be greater than 0', 'error')
      return
    }

    try {
      const payload = {
        sku: variantForm.sku || undefined,
        size: parseFloat(variantForm.size),
        sizeUnit: variantForm.sizeUnit,
        packageType: variantForm.packageType,
        isDefault: variantForm.isDefault,
        active: variantForm.active,
      }

      if (editingVariant) {
        // Update existing variant
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/variants/${editingVariant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error('Failed to update variant')

        const updated = await response.json()
        setVariants(variants.map(v => v.id === updated.id ? updated : v))
        showToast('Variant updated successfully', 'success')
      } else {
        // Create new variant
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error('Failed to create variant')

        const newVariant = await response.json()
        setVariants([...variants, newVariant])
        showToast('Variant created successfully', 'success')
      }

      setShowVariantForm(false)
      setEditingVariant(null)
    } catch (err: any) {
      console.error('Save variant error:', err)
      showToast(err.message || 'Failed to save variant', 'error')
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/variants/${variantId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to delete variant')

      setVariants(variants.filter(v => v.id !== variantId))
      showToast('Variant deleted successfully', 'success')
    } catch (err: any) {
      console.error('Delete variant error:', err)
      showToast(err.message || 'Failed to delete variant', 'error')
    }
  }

  const handleSetDefaultVariant = async (variantId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}/variants/${variantId}/set-default`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error('Failed to set default variant')

      // Update local state
      setVariants(variants.map(v => ({
        ...v,
        isDefault: v.id === variantId,
      })))
      showToast('Default variant updated', 'success')
    } catch (err: any) {
      console.error('Set default variant error:', err)
      showToast(err.message || 'Failed to set default variant', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Product not found'}</p>
          <Button onClick={() => router.push('/products')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/products/${productId}`}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Product Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Edit Product</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Update product information and configuration
        </p>
      </div>

      {/* Edit Form */}
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

              {/* Source Info (Read-only) */}
              {product.source && (
                <div className="flex items-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    product.source === 'quickbooks_import'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {product.source === 'quickbooks_import' ? 'QB Import' : 'Manual'}
                  </span>
                </div>
              )}
            </div>
            {/* Product Variants Section - Moved to bottom of main card */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Product Variants</h3>
                <Button
                  type="button"
                  onClick={handleAddVariant}
                  className="bg-green-600 hover:bg-green-700 h-7 text-xs px-3"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
            {/* Variant Form */}
            {showVariantForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-base font-medium mb-3">
                  {editingVariant ? 'Edit Variant' : 'Add Variant'}
                </h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Size
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variantForm.size}
                      onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                      placeholder="10"
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <select
                      value={variantForm.sizeUnit}
                      onChange={(e) => setVariantForm({ ...variantForm, sizeUnit: e.target.value })}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
                      required
                    >
                      <option value="lb">lb</option>
                      <option value="kg">kg</option>
                      <option value="oz">oz</option>
                      <option value="g">g</option>
                      <option value="ton">ton</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Package
                    </label>
                    <select
                      value={variantForm.packageType}
                      onChange={(e) => setVariantForm({ ...variantForm, packageType: e.target.value })}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
                      required
                    >
                      <option value="bag">Bag</option>
                      <option value="box">Box</option>
                      <option value="case">Case</option>
                      <option value="pallet">Pallet</option>
                      <option value="bulk">Bulk</option>
                      <option value="each">Each</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={variantForm.isDefault}
                        onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked })}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-1.5 text-gray-700">Default</span>
                    </label>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveVariant}
                    className="bg-blue-600 hover:bg-blue-700 h-9 px-4"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowVariantForm(false)
                      setEditingVariant(null)
                    }}
                    className="h-9 px-4"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Variants List */}
            {variants.length === 0 && !showVariantForm ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No variants defined. Click "Add Variant" to create one.
              </div>
            ) : (
              <div className="space-y-1.5">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`flex items-center justify-between px-3 py-2 rounded ${
                      variant.isDefault ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {variant.isDefault ? (
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-600">
                          <Star className="h-3 w-3 text-white fill-white" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultVariant(variant.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-colors"
                          title="Set as default"
                        >
                          <Star className="h-3 w-3 text-gray-300 hover:text-blue-600" />
                        </button>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {variant.size} {variant.sizeUnit} {variant.packageType}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditVariant(variant)}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
