'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldCheck,
  Key,
  Smartphone,
  CheckCircle2,
  Copy,
  Download,
  AlertTriangle,
} from 'lucide-react'

export default function SecurityPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [showSetupFlow, setShowSetupFlow] = useState(false)
  const [setupStep, setSetupStep] = useState<'scan' | 'verify' | 'backup'>('scan')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes] = useState([
    'A1B2-C3D4',
    'E5F6-G7H8',
    'I9J0-K1L2',
    'M3N4-O5P6',
    'Q7R8-S9T0',
    'U1V2-W3X4',
    'Y5Z6-A7B8',
    'C9D0-E1F2',
  ])

  const handleEnableMFA = () => {
    setShowSetupFlow(true)
    setSetupStep('scan')
  }

  const handleVerifyCode = () => {
    // Mock verification
    if (verificationCode.length === 6) {
      setSetupStep('backup')
    }
  }

  const handleCompleteMFASetup = () => {
    setMfaEnabled(true)
    setShowSetupFlow(false)
    setSetupStep('scan')
    setVerificationCode('')
  }

  const handleDisableMFA = () => {
    setMfaEnabled(false)
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
  }

  const downloadBackupCodes = () => {
    const element = document.createElement('a')
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'mfa-backup-codes.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Security Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account security and authentication</p>
        </div>

        {/* MFA Status Card */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-3 ${
                    mfaEnabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <ShieldCheck
                    className={`h-6 w-6 ${mfaEnabled ? 'text-green-600' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Two-Factor Authentication (MFA)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {mfaEnabled
                      ? 'Your account is protected with MFA'
                      : 'Add an extra layer of security to your account'}
                  </CardDescription>
                </div>
              </div>
              <div>
                {mfaEnabled ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!mfaEnabled ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Two-factor authentication adds an additional layer of security to your account by
                  requiring more than just a password to sign in.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Scan a QR code with your authenticator app</li>
                    <li>Enter a verification code to confirm setup</li>
                    <li>Save backup codes for emergency access</li>
                    <li>Use your phone to verify login attempts</li>
                  </ul>
                </div>
                <Button
                  onClick={handleEnableMFA}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Authenticator App</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Configured and active for time-based codes
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Backup Codes</h4>
                    </div>
                    <p className="text-sm text-gray-600">8 unused backup codes available</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-gray-300">
                    View Backup Codes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDisableMFA}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Disable MFA
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Security Activity */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Recent Security Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Successful login</p>
                  <p className="text-xs text-gray-500">
                    Chrome on Windows • Oct 31, 2025 at 10:30 AM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Successful login</p>
                  <p className="text-xs text-gray-500">
                    Chrome on Windows • Oct 30, 2025 at 3:45 PM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Key className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Password changed</p>
                  <p className="text-xs text-gray-500">Oct 28, 2025 at 9:15 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MFA Setup Modal */}
      {showSetupFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-900">
                {setupStep === 'scan' && 'Scan QR Code'}
                {setupStep === 'verify' && 'Verify Setup'}
                {setupStep === 'backup' && 'Save Backup Codes'}
              </CardTitle>
              <CardDescription>
                {setupStep === 'scan' && 'Step 1 of 3: Use your authenticator app'}
                {setupStep === 'verify' && 'Step 2 of 3: Confirm it works'}
                {setupStep === 'backup' && 'Step 3 of 3: Emergency access codes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {setupStep === 'scan' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4">
                      {/* Mock QR Code */}
                      <div className="w-40 h-40 bg-gray-900" style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 10px, white 10px, white 11px),
                          repeating-linear-gradient(90deg, transparent, transparent 10px, white 10px, white 11px)
                        `
                      }} />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      Recommended Authenticator Apps:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Google Authenticator</li>
                      <li>• Microsoft Authenticator</li>
                      <li>• Authy</li>
                    </ul>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-2">Can't scan? Enter this code manually:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                        JBSWY3DPEHPK3PXP
                      </code>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowSetupFlow(false)}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setSetupStep('verify')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Next: Verify Code
                    </Button>
                  </div>
                </div>
              )}

              {setupStep === 'verify' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit verification code from your authenticator app to confirm the
                    setup.
                  </p>
                  <div>
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                      Verification Code
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 text-center text-2xl font-mono tracking-widest"
                      autoFocus
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Make sure the time on your phone and computer are synchronized for codes to
                        work correctly.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSetupStep('scan')}
                      className="border-gray-300"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Verify & Continue
                    </Button>
                  </div>
                </div>
              )}

              {setupStep === 'backup' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          Save these backup codes!
                        </p>
                        <p className="text-sm text-red-800">
                          If you lose access to your authenticator app, you can use these one-time
                          codes to sign in.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="bg-white px-3 py-2 rounded border border-gray-200 text-center"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={copyBackupCodes}
                      className="flex-1 border-gray-300"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Codes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadBackupCodes}
                      className="flex-1 border-gray-300"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleCompleteMFASetup}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Setup
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
