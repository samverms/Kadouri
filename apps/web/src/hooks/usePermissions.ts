import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

export function useUserRole() {
  const { getToken } = useAuth()
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const token = await getToken()
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || '') + '/api/me/role', {
          credentials: 'include',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        const data = await res.json()
        setRole(data.role)
        setPermissions(data.permissions)
      } catch (err) {
        console.error('Failed to fetch user role:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRole()
  }, [getToken])

  return { role, permissions, loading }
}

export function usePermission(module, action) {
  const { permissions, loading } = useUserRole()
  
  if (loading) return false
  
  return permissions.some(p => p.module === module && p.action === action)
}
