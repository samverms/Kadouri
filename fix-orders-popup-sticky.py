#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change hover behavior to click behavior
# Update state name
content = content.replace(
    '  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null)',
    '  const [openOrdersAccountId, setOpenOrdersAccountId] = useState<string | null>(null)'
)

# Update the handler functions
old_handlers = '''  const handleMouseEnter = (accountId: string) => {
    setHoveredAccountId(accountId)
    fetchAccountOrders(accountId)
  }

  const handleMouseLeave = () => {
    setHoveredAccountId(null)
  }'''

new_handlers = '''  const handleToggleOrders = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (openOrdersAccountId === accountId) {
      setOpenOrdersAccountId(null)
    } else {
      setOpenOrdersAccountId(accountId)
      fetchAccountOrders(accountId)
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenOrdersAccountId(null)
    }

    if (openOrdersAccountId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openOrdersAccountId])'''

content = content.replace(old_handlers, new_handlers)

# Update the button and popup to use click instead of hover
old_button = '''                          <td className="px-6 py-4 whitespace-nowrap text-center relative">
                            <div
                              className="inline-block"
                              onMouseEnter={() => handleMouseEnter(account.id)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <button className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-purple-50 text-purple-600 hover:text-purple-700 transition-colors">
                                <FileText className="h-4 w-4" />
                              </button>

                              {hoveredAccountId === account.id && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-4">'''

new_button = '''                          <td className="px-6 py-4 whitespace-nowrap text-center relative">
                            <div className="inline-block relative">
                              <button
                                onClick={(e) => handleToggleOrders(account.id, e)}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                                  openOrdersAccountId === account.id
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                              </button>

                              {openOrdersAccountId === account.id && (
                                <div
                                  className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-4"
                                  onClick={(e) => e.stopPropagation()}
                                >'''

content = content.replace(old_button, new_button)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated orders popup to stay open until clicked away")
