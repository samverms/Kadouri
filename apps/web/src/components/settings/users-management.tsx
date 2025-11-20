'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Loader2, User } from 'lucide-react'

interface UserData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
  imageUrl?: string
}

const roleColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BackOffice: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Accountant: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  agent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  readonly: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export function UsersManagement() {
  const { getToken } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users`, {
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
      </div>
    )
  }

  return (
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
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Last Login
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.firstName || user.lastName
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : user.email.split('@')[0]}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                <span className={`rounded-full px-2 py-1 text-xs ${roleColors[user.role] || roleColors.agent}`}>
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    user.active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
