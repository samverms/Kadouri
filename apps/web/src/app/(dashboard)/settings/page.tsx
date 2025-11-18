'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Database,
  Mail,
  FileText,
  DollarSign,
  Loader2,
} from 'lucide-react'

interface QuickBooksStatus {
  connected: boolean
  realmId?: string
  expiresAt?: string
  isExpired?: boolean
}

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [qbStatus, setQbStatus] = useState<QuickBooksStatus | null>(null)
  const [qbLoading, setQbLoading] = useState(true)

  useEffect(() => {
    fetchQuickBooksStatus()
  }, [])

  const fetchQuickBooksStatus = async () => {
    try {
      setQbLoading(true)
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || ''}/api/quickbooks/status', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setQbStatus(data)
      } else {
        setQbStatus({ connected: false })
      }
    } catch (error) {
      console.error('Failed to fetch QuickBooks status:', error)
      setQbStatus({ connected: false })
    } finally {
      setQbLoading(false)
    }
  }

  const handleQuickBooksConnect = () => {
    window.location.href = '${process.env.NEXT_PUBLIC_API_URL || ''}/api/quickbooks/connect'
  }

  const handleQuickBooksDisconnect = async () => {
    try {
      setQbLoading(true)
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || ''}/api/quickbooks/disconnect', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Refresh status after disconnect
        await fetchQuickBooksStatus()
      } else {
        alert('Failed to disconnect from QuickBooks')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      alert('Failed to disconnect from QuickBooks')
    } finally {
      setQbLoading(false)
    }
  }

  const handleSave = async (section: string) => {
    setIsSaving(true)
    // TODO: Implement save logic
    console.log(`Saving ${section} settings...`)
    setTimeout(() => setIsSaving(false), 1000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Manage your application settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="quickbooks" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">QuickBooks</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic application configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="America/Los_Angeles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input id="dateFormat" defaultValue="MM/DD/YYYY" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" defaultValue="USD" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input id="language" defaultValue="English" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('general')} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates for order changes</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">QuickBooks Sync Alerts</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when sync completes or fails</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alert when product inventory is low</p>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="Kaduri Connection" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="info@kaduriconnection.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main Street" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Los Angeles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="CA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" placeholder="90001" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('company')} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax rates and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / EIN</Label>
                  <Input id="taxId" placeholder="XX-XXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input id="taxRate" type="number" placeholder="8.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QuickBooks Settings */}
        <TabsContent value="quickbooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QuickBooks Online Integration</CardTitle>
              <CardDescription>Manage your QuickBooks connection and sync settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                {qbLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Checking connection status...</span>
                  </div>
                ) : qbStatus?.connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Connection Status</p>
                        <p className="text-sm text-gray-500">
                          Connected to QuickBooks Online
                          {qbStatus.isExpired && <span className="ml-2 text-red-600">(Token Expired)</span>}
                        </p>
                        {qbStatus.realmId && (
                          <p className="text-xs text-gray-400 mt-1">Company ID: {qbStatus.realmId}</p>
                        )}
                        {qbStatus.expiresAt && !qbStatus.isExpired && (
                          <p className="text-xs text-gray-400 mt-1">
                            Expires: {new Date(qbStatus.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleQuickBooksDisconnect}
                      disabled={qbLoading}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gray-100 p-2">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">Connection Status</p>
                        <p className="text-sm text-gray-500">Not connected to QuickBooks Online</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleQuickBooksConnect}
                    >
                      Connect to QuickBooks
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sync Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Sync Orders</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically sync new orders to QuickBooks</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Way Sync</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sync changes from QuickBooks back to PACE</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncFrequency">Sync Frequency</Label>
                  <select
                    id="syncFrequency"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    defaultValue="realtime"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Once Daily</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Default Mappings</h3>

                <div className="space-y-2">
                  <Label htmlFor="defaultAccount">Default Income Account</Label>
                  <Input id="defaultAccount" placeholder="Sales Revenue" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultPaymentTerm">Default Payment Terms</Label>
                  <select
                    id="defaultPaymentTerm"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    defaultValue="net30"
                  >
                    <option value="due-on-receipt">Due on Receipt</option>
                    <option value="net15">Net 15</option>
                    <option value="net30">Net 30</option>
                    <option value="net60">Net 60</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline">Sync Now</Button>
                <Button onClick={() => handleSave('quickbooks')} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Recent synchronization activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="text-sm font-medium">Order #1234 synced</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                    Success
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="text-sm font-medium">Customer ABC Farms synced</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                    Success
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Product sync attempted</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                    Failed
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP settings for sending emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" placeholder="587" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input id="smtpUser" type="email" placeholder="your-email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input id="smtpPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input id="fromEmail" type="email" placeholder="noreply@kaduriconnection.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input id="fromName" placeholder="Kaduri Connection" />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline">Test Connection</Button>
                <Button onClick={() => handleSave('email')} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Default templates for automated emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sent when order is created</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Invoice Notification</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sent when invoice is posted to QuickBooks</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Payment Receipt</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sent when payment is received</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Settings */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PDF Settings</CardTitle>
              <CardDescription>Configure PDF generation and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Company Logo URL</Label>
                <Input id="logoUrl" placeholder="https://example.com/logo.png" />
                <p className="text-xs text-gray-500">Used in PDFs and email templates</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfFooter">PDF Footer Text</Label>
                <Input
                  id="pdfFooter"
                  placeholder="Thank you for your business!"
                  defaultValue="Thank you for your business!"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Include QR Code</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add QR code linking to order details</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Commission Details</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Display commission info on seller PDFs</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('documents')} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>AWS S3 configuration for document storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s3Bucket">S3 Bucket Name</Label>
                <Input id="s3Bucket" placeholder="pace-crm-documents" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s3Region">AWS Region</Label>
                  <Input id="s3Region" placeholder="us-west-2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3AccessKey">Access Key ID</Label>
                  <Input id="s3AccessKey" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3SecretKey">Secret Access Key</Label>
                <Input id="s3SecretKey" type="password" placeholder="••••••••••••••••" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Permissions */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <Button>
                  <User className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-transparent">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Admin User
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        admin@pace.com
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                          Admin
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        John Agent
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        john@pace.com
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                          Agent
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Sarah Viewer
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        sarah@pace.com
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          Read-Only
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Permissions
              </CardTitle>
              <CardDescription>Configure what each role can do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Admin</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> Full access to all features
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> Manage users and permissions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> QuickBooks integration settings
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Agent</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> Create and edit orders
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> Manage accounts and products
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-600">✗</span> Cannot modify settings
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Read-Only</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> View orders and reports
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-600">✗</span> Cannot create or edit data
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
