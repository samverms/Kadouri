#!/usr/bin/env python3
# Add infinite scroll / streaming loading to accounts page

# Read the current file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useRef for scroll detection
content = content.replace(
    "import { useState, useEffect, Fragment } from 'react'",
    "import { useState, useEffect, Fragment, useRef, useCallback } from 'react'"
)

# 2. Update state to support pagination
old_state = '''  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')'''

new_state = '''  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)'''

content = content.replace(old_state, new_state)

# 3. Replace fetchAccounts with paginated version
old_fetch = '''  const fetchAccounts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
      const response = await fetch(`${apiUrl}/api/accounts`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data)
    } catch (err) {
      console.error('Fetch accounts error:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }'''

new_fetch = '''  const fetchAccounts = async (pageNum: number = 0, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setAccounts([])
      setPage(0)
      setHasMore(true)
    }

    setError('')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000'
      const offset = pageNum * 50
      const response = await fetch(`${apiUrl}/api/accounts?limit=50&offset=${offset}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()

      if (append) {
        setAccounts(prev => [...prev, ...data])
      } else {
        setAccounts(data)
      }

      // If we got less than 50 records, we've reached the end
      if (data.length < 50) {
        setHasMore(false)
      }

      setPage(pageNum)
    } catch (err) {
      console.error('Fetch accounts error:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }'''

content = content.replace(old_fetch, new_fetch)

# 4. Update useEffect to call new fetch
content = content.replace(
    '''  useEffect(() => {
    fetchAccounts()
  }, [])''',
    '''  useEffect(() => {
    fetchAccounts(0, false)
  }, [])'''
)

# 5. Add intersection observer for infinite scroll
old_handle_account = '''  const handleAccountCreated = (newAccount: Account) => {
    setAccounts([newAccount, ...accounts])
    setShowCreateModal(false)
  }'''

new_handle_account = '''  const handleAccountCreated = (newAccount: Account) => {
    setAccounts([newAccount, ...accounts])
    setShowCreateModal(false)
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchAccounts(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading, isLoadingMore, page])'''

content = content.replace(old_handle_account, new_handle_account)

# 6. Add loading indicator at bottom of table
old_table_end = '''            </div>
            {filteredAccounts.length === 0 && !isLoading && ('''

new_table_end = '''            </div>

            {/* Infinite scroll trigger */}
            {!isLoading && hasMore && (
              <div ref={observerTarget} className="py-4 text-center">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                    <span className="text-sm">Loading more accounts...</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Scroll for more</div>
                )}
              </div>
            )}

            {filteredAccounts.length === 0 && !isLoading && ('''

content = content.replace(old_table_end, new_table_end)

# 7. Update search to reset pagination
old_search_input = '''            <Input
              placeholder="Search by name, code, location, phone, email, or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />'''

new_search_input = '''            <Input
              placeholder="Search by name, code, location, phone, email, or order number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                // Reset to first page when searching
                if (e.target.value === '') {
                  fetchAccounts(0, false)
                }
              }}
              className="pl-10"
            />'''

content = content.replace(old_search_input, new_search_input)

# Write updated file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully!')
print('- Added infinite scroll loading')
print('- Loads 50 accounts at a time')
print('- Automatically loads more when scrolling to bottom')
print('- Shows loading spinner while fetching')
print('- Much faster initial load')
