import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export function useApi() {
  const { getToken } = useAuth()

  const apiFetch = useCallback(async (endpoint: string, options?: RequestInit) => {
    const token = await getToken()

    const headers = new Headers(options?.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    if (!headers.has('Content-Type') && options?.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }

    const url = API_URL + endpoint
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
  }, [getToken])

  return { apiFetch }
}

// For use in non-hook contexts (like useEffect callbacks), export a function that takes token
export async function apiFetchWithToken(endpoint: string, token: string | null, options?: RequestInit) {
  const headers = new Headers(options?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && options?.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const url = API_URL + endpoint
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}
