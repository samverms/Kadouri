'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Edit, FileText, Calendar, Package, DollarSign, Download, Upload, Trash2, CheckCircle } from 'lucide-react'
import { EmailContractModal } from '@/components/contracts/email-contract-modal'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [params.id])

  const fetchContract = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/contracts/${params.id}`, {
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to fetch contract')

      const data = await res.json()
      setContract(data)
    } catch (error) {
      console.error('Error fetching contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/pdf/contract/${params.id}`, {
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to generate PDF')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Clean up the blob URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/contracts/${params.id}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to upload document')

      alert('Document uploaded successfully!')
      fetchContract() // Refresh contract data
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleEdit = () => {
    router.push(`/contracts/${params.id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/contracts/${params.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to delete contract')

      alert('Contract deleted successfully')
      router.push('/contracts')
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert('Failed to delete contract')
    }
  }

  const handleMarkComplete = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/contracts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' }),
      })

      if (!res.ok) throw new Error('Failed to update contract status')

      alert('Contract marked as completed')
      fetchContract()
    } catch (error) {
      console.error('Error updating contract:', error)
      alert('Failed to update contract status')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contract not found</h1>
          <Button onClick={() => router.push('/contracts')} className="mt-4">
            Back to Contracts
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200'
    }
  }

  const utilizationPercentage =
    ((parseFloat(contract.totalQuantity) - parseFloat(contract.remainingQuantity)) /
      parseFloat(contract.totalQuantity)) *
    100

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/contracts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-blue-400">
              Contract #{contract.contractNumber}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Created {new Date(contract.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
              contract.status
            )}`}
          >
            {contract.status.toUpperCase()}
          </span>
          <Button
            onClick={handleEdit}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button
            onClick={() => setEmailModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Contract
          </Button>
          {contract.status !== 'completed' && (
            <Button
              onClick={handleMarkComplete}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          <Button
            onClick={handleDelete}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Seller */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded">
                      SELLER
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {contract.seller.companyName}
                  </h3>
                  {contract.seller.email && (
                    <p className="text-sm text-gray-600">{contract.seller.email}</p>
                  )}
                </div>

                {/* Buyer */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-semibold text-white bg-green-600 rounded">
                      BUYER
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {contract.buyer.companyName}
                  </h3>
                  {contract.buyer.email && (
                    <p className="text-sm text-gray-600">{contract.buyer.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Product & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Product</p>
                  <p className="font-semibold">{contract.product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unit</p>
                  <p className="font-semibold">{contract.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                  <p className="font-semibold">
                    {parseFloat(contract.totalQuantity).toLocaleString()} {contract.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Remaining</p>
                  <p className="font-semibold text-green-600">
                    {parseFloat(contract.remainingQuantity).toLocaleString()} {contract.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price per {contract.unit}</p>
                  <p className="font-semibold">
                    ${parseFloat(contract.pricePerUnit).toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Value</p>
                  <p className="font-semibold text-xl text-blue-600">
                    ${parseFloat(contract.totalValue).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Utilization Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Contract Utilization</span>
                  <span className="font-semibold">{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${utilizationPercentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          {contract.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.terms}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {contract.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Valid From</p>
                <p className="font-semibold">
                  {new Date(contract.validFrom).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="font-semibold">
                  {new Date(contract.validUntil).toLocaleDateString()}
                </p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">Days Remaining</p>
                <p className="font-semibold text-lg">
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(contract.validUntil).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Existing Documents */}
              {contract.executedDocumentUrl && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-semibold text-green-800">Executed Contract</p>
                  <p className="text-xs text-green-600 mt-1">
                    Uploaded {new Date(contract.executedUploadedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {contract.draftDocumentUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-semibold text-blue-800">Draft Contract</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Generated {new Date(contract.draftGeneratedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* File Upload Area */}
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-600 mb-2">Upload Executed Contract</p>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <Upload className={`h-8 w-8 mx-auto mb-2 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {uploadingFile ? 'Uploading...' : 'Drop file here or click to upload'}
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={uploadingFile}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orders Created</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Quantity Used</span>
                <span className="font-semibold">
                  {(parseFloat(contract.totalQuantity) - parseFloat(contract.remainingQuantity)).toLocaleString()} {contract.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Currency</span>
                <span className="font-semibold">{contract.currency}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <EmailContractModal
          contract={contract}
          onClose={() => setEmailModalOpen(false)}
          onSuccess={() => {
            // Could show a success toast here
            setEmailModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
