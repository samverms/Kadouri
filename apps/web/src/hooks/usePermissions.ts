import { useState, useEffect } from 'react'

export function useUserRole() {
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000') + '/api/me/role', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setRole(data.role)
        setPermissions(data.permissions)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch user role:', err)
        setLoading(false)
      })
  }, [])

  return { role, permissions, loading }
}

export function usePermission(module, action) {
  const { permissions, loading } = useUserRole()
  
  if (loading) return false
  
  return permissions.some(p => p.module === module && p.action === action)
}
