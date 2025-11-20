'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Send, FileText } from 'lucide-react'

export default function ComposeEmailPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [to, setTo] = useState('')
  const [cc, setCC] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const templates = [
    { id: '1', name: 'Order Confirmation', subject: 'Order Confirmation - {{orderNumber}}', body: 'Dear {{customerName}},\n\nThank you for your order #{{orderNumber}}.\n\nOrder Details:\n- Date: {{orderDate}}\n- Total Amount: {{totalAmount}}\n\nBest regards,\nKadouri CRM Team' },
    { id: '2', name: 'Invoice Sent', subject: 'Invoice {{invoiceNumber}} - Kadouri CRM', body: 'Dear {{customerName}},\n\nPlease find attached invoice {{invoiceNumber}}.\n\nAmount Due: {{amount}}\nDue Date: {{dueDate}}\n\nThank you for your business!\n\nBest regards,\nKadouri CRM Team' },
    { id: '3', name: 'Quote Follow-up', subject: 'Following up on Quote {{quoteNumber}}', body: 'Dear {{customerName}},\n\nI wanted to follow up on the quote we sent you (Quote #{{quoteNumber}}).\n\nDo you have any questions or would you like to proceed?\n\nBest regards,\n{{agentName}}\nKadouri CRM' },
  ]

  useEffect(() => {
    // Load template from sessionStorage if coming from templates page
    const storedTemplate = sessionStorage.getItem('emailTemplate')
    if (storedTemplate) {
      const template = JSON.parse(storedTemplate)
      setSelectedTemplate(template.id)
      setSubject(template.subject)
      // Load body from templates array
      const fullTemplate = templates.find(t => t.name === template.name)
      if (fullTemplate) {
        setBody(fullTemplate.body)
      }
      sessionStorage.removeItem('emailTemplate')
    }
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compose Email</h1>
        <p className="mt-2 text-gray-600">Send emails using your connected Outlook account</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Template Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Template</CardTitle>
            <CardDescription>Choose a pre-made template or start fresh</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTemplate('')
                  setSubject('')
                  setBody('')
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Blank Email
              </Button>
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {template.name}
                </Button>
              ))}
            </div>

            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Outlook Connection</h3>
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-600">Not Connected</span>
                </div>
                <Button size="sm" className="mt-3 w-full bg-blue-600 hover:bg-blue-700">
                  Connect Outlook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Composer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Compose Message</CardTitle>
            <CardDescription>Fill in the email details</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CC
                </label>
                <Input
                  type="email"
                  placeholder="cc@example.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[300px] font-mono text-sm"
                  placeholder="Type your message here...&#10;&#10;You can use variables like {{customerName}}, {{orderNumber}}, etc."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use double curly braces for variables: {`{{variableName}}`}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!to || !subject || !body}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button type="button" variant="outline">
                  Save as Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
