'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Mail } from 'lucide-react'

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState([
    {
      id: '1',
      name: 'Order Confirmation',
      subject: 'Order Confirmation - {{orderNumber}}',
      category: 'order_confirmation',
      variables: ['orderNumber', 'customerName', 'orderDate', 'totalAmount'],
      isActive: true,
    },
    {
      id: '2',
      name: 'Invoice Sent',
      subject: 'Invoice {{invoiceNumber}} - Kaduri Connection',
      category: 'invoice',
      variables: ['invoiceNumber', 'customerName', 'dueDate', 'amount'],
      isActive: true,
    },
    {
      id: '3',
      name: 'Quote Follow-up',
      subject: 'Following up on Quote {{quoteNumber}}',
      category: 'follow_up',
      variables: ['quoteNumber', 'customerName', 'agentName'],
      isActive: true,
    },
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleUseTemplate = (template: typeof templates[0]) => {
    // Store template in sessionStorage and navigate to compose
    sessionStorage.setItem('emailTemplate', JSON.stringify(template))
    router.push('/email/compose')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Email Templates</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Create and manage email templates with dynamic variables</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>Design an email template with dynamic variables</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <Input placeholder="e.g., Order Confirmation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="order_confirmation">Order Confirmation</option>
                  <option value="invoice">Invoice</option>
                  <option value="quote">Quote</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <Input placeholder="Use {{variableName}} for dynamic content" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[200px]"
                  placeholder="Dear {{customerName}},&#10;&#10;Your email content here...&#10;&#10;Available variables: {{orderNumber}}, {{customerName}}, {{agentName}}, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Variables (comma-separated)
                </label>
                <Input placeholder="orderNumber, customerName, totalAmount" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      {template.category}
                    </span>
                  </CardDescription>
                </div>
                <div className={`h-3 w-3 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Variables:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Mail className="mr-1 h-3 w-3" />
                    Use
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
