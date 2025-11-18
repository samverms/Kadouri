export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
}

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = getApiUrl() + endpoint
  return fetch(url, {
    credentials: 'include',
    ...options,
  })
}
