'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Users, Search, UserPlus, Mail, Shield, Calendar, X } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired'
  invitedBy: string
  createdAt: string
  expiresAt: string
}

const roleColors = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-purple-100 text-purple-800 border-purple-200',
  agent: 'bg-blue-100 text-blue-800 border-blue-200',
  readonly: 'bg-gray-100 text-gray-800 dark:text-gray-200 border-gray-200',
}

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  agent: 'Sales Agent',
  readonly: 'Read Only',
}

export default function UsersPage() {
  const { user: currentUser } = useUser()
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('agent')

  const currentUserRole = (currentUser?.publicMetadata?.role as string) || 'agent'
  const canManageUsers = ['admin', 'manager'].includes(currentUserRole)

  // TODO: Replace with actual API call
  const users: User[] = [
    {
      id: currentUser?.id || '1',
      email: currentUser?.emailAddresses?.[0]?.emailAddress || 'user@example.com',
      firstName: currentUser?.firstName || 'Current',
      lastName: currentUser?.lastName || 'User',
      role: currentUserRole,
      active: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]

  // TODO: Replace with actual API call
  const invitations: Invitation[] = []

  const handleSendInvitation = async () => {
    // TODO: Implement API call to send invitation
    console.log('Sending invitation to:', inviteEmail, 'with role:', inviteRole)
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteRole('agent')
  }

  if (!canManageUsers) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Users</h1>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access user management.
              <br />
              Only administrators and managers can manage users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredInvitations = invitations.filter(invitation =>
    invitation.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-blue-400">Users</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-300">Manage team members and permissions</p>
              </div>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Invite User
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Active Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'invitations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Pending Invitations ({invitations.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full sm:w-[70%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'users' ? 'Search users...' : 'Search invitations...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            roleColors[user.role as keyof typeof roleColors]
                          }`}
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {roleLabels[user.role as keyof typeof roleLabels]}
                        </span>
                        {user.active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:text-gray-200 border border-gray-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.lastLoginAt && (
                          <span>
                            Last login {new Date(user.lastLoginAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      Change Role
                    </button>
                    {user.active ? (
                      <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        Deactivate
                      </button>
                    ) : (
                      <button className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="grid gap-4">
            {filteredInvitations.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Mail className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No pending invitations</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Click "Invite User" to send an invitation
                </p>
              </div>
            ) : (
              filteredInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Mail className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {invitation.email}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              roleColors[invitation.role as keyof typeof roleColors]
                            }`}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {roleLabels[invitation.role as keyof typeof roleLabels]}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              invitation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : invitation.status === 'accepted'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sent {new Date(invitation.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </span>
                          <span>Invited by {invitation.invitedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {invitation.status === 'pending' && (
                        <>
                          <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Resend
                          </button>
                          <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowInviteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invite User</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="agent">Sales Agent</option>
                    <option value="manager">Manager</option>
                    {currentUserRole === 'admin' && <option value="admin">Administrator</option>}
                    <option value="readonly">Read Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={!inviteEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
