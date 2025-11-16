'use client'

import { useState, useEffect } from 'react'
import { Shield, Save } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => { fetchRoles(); fetchPermissions() }, [])

  const fetchRoles = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
    const res = await fetch(apiUrl + '/api/roles', { credentials: 'include' })
    setRoles(await res.json())
    setIsLoading(false)
  }

  const fetchPermissions = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
    const res = await fetch(apiUrl + '/api/permissions', { credentials: 'include' })
    setPermissions(await res.json())
  }

  const fetchRoleDetails = async (roleId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
    const res = await fetch(apiUrl + '/api/roles/' + roleId, { credentials: 'include' })
    setSelectedRole(await res.json())
  }

  const togglePerm = (pid: string) => {
    if (!selectedRole) return
    const has = selectedRole.permissions.some((p: any) => p.id === pid)
    const updated = has ? selectedRole.permissions.filter((p: any) => p.id !== pid) : [...selectedRole.permissions, permissions.find((p: any) => p.id === pid)]
    setSelectedRole({ ...selectedRole, permissions: updated })
  }

  const save = async () => {
    if (!selectedRole) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
    try {
      await fetch(apiUrl + '/api/roles/' + selectedRole.id + '/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissionIds: selectedRole.permissions.map((p: any) => p.id) })
      })
      showToast('Role permissions saved successfully', 'success')
    } catch (error: any) {
      showToast(`Error saving permissions: ${error.message}`, 'error')
    }
  }

  const grouped: any = {}
  permissions.forEach((p: any) => { if (!grouped[p.module]) grouped[p.module] = []; grouped[p.module].push(p) })

  if (isLoading) return <div className="p-12">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Role Management</h1>
      <div className="grid grid-cols-4 gap-6">
        <div>
          <div className="bg-white rounded shadow">
            <div className="p-4 border-b"><h2 className="font-bold">Roles</h2></div>
            {roles.map(r => (
              <button key={r.id} onClick={() => fetchRoleDetails(r.id)} className="w-full text-left p-4 hover:bg-gray-50">
                <div className="font-medium">{r.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-3">
          {selectedRole ? (
            <div className="bg-white rounded shadow">
              <div className="p-6 border-b flex justify-between">
                <div><h2 className="text-xl font-bold">{selectedRole.name}</h2></div>
                <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              </div>
              <div className="p-6">
                {Object.entries(grouped).map(([mod, perms]) => (
                  <div key={mod} className="border p-4 mb-4">
                    <h4 className="font-bold mb-2 capitalize">{mod}</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {(perms as any[]).map((p: any) => (
                        <label key={p.id} className="flex gap-2">
                          <input type="checkbox" checked={selectedRole.permissions.some((sp: any) => sp.id === p.id)} onChange={() => togglePerm(p.id)} />
                          <span className="text-sm capitalize">{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="bg-white rounded shadow p-12 text-center">Select a role</div>}
        </div>
      </div>
    </div>
  )
}
