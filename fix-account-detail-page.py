#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the mock data section with real API fetching
old_section = '''export default function AccountDetailPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'contacts'>('overview')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Mock data - will be replaced with API call
  const account = {
    id: params.id,
    code: 'ACC-001',
    name: 'Fresh Valley Farms',
    qboCustomerId: 'QBO-123',
    active: true,
    createdAt: '2025-01-15',
  }

  const transactions = [
    {
      id: '1',
      orderNo: '2510-0025',
      type: 'seller',
      date: '2025-10-07',
      buyer: 'Fresh Valley Farms',
      seller: 'Western Mixers',
      products: 'LA NOGALERA',
      items: 'PECANS + 1 more',
      total: '$132,930.00',
      agent: 'Agent User',
      commission: '$2.00',
      status: 'confirmed',
    },
    {
      id: '2',
      orderNo: '2510-001',
      type: 'buyer',
      date: '2025-10-06',
      buyer: 'Fresh Valley Farms',
      seller: 'TORA & GLASSER',
      products: 'NIC...',
      items: 'PRUNES',
      total: '$378,000.00',
      agent: 'Agent User',
      commission: '$2.50',
      status: 'confirmed',
    },
    {
      id: '3',
      orderNo: '2510-004',
      type: 'seller',
      date: '2025-10-05',
      buyer: 'Medium Farms',
      seller: 'Fresh Valley Farms',
      products: 'Tools Impex',
      items: 'CORNUT',
      total: '$53,280.00',
      agent: 'Agent User',
      commission: '$2.00',
      status: 'confirmed',
    },
  ]

  const addresses = [
    {
      id: '1',
      type: 'billing',
      line1: '123 Farm Road',
      line2: 'Suite 100',
      city: 'Sacramento',
      state: 'CA',
      postalCode: '95814',
      country: 'US',
      isPrimary: true,
    },
    {
      id: '2',
      type: 'shipping',
      line1: '456 Warehouse Ave',
      city: 'Sacramento',
      state: 'CA',
      postalCode: '95816',
      country: 'US',
      isPrimary: false,
    },
  ]

  const contacts = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@freshvalley.com',
      phone: '(916) 555-0123',
      isPrimary: true,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@freshvalley.com',
      phone: '(916) 555-0124',
      isPrimary: false,
    },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'addresses', label: 'Addresses', count: addresses.length },
    { id: 'contacts', label: 'Contacts', count: contacts.length },
  ]'''

new_section = '''export default function AccountDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'contacts'>('overview')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [account, setAccount] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAccountData()
  }, [accountId])

  const fetchAccountData = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Fetch account details
      const accountResponse = await fetch(`http://localhost:2000/api/accounts/${accountId}`, {
        credentials: 'include',
      })

      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account')
      }

      const accountData = await accountResponse.json()
      setAccount(accountData)

      // Fetch transactions for this account
      const transactionsResponse = await fetch(`http://localhost:2000/api/invoices?accountId=${accountId}`, {
        credentials: 'include',
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load account data')
    } finally {
      setIsLoading(false)
    }
  }

  const addresses = account?.addresses || []
  const contacts = account?.contacts || []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'addresses', label: 'Addresses', count: addresses.length },
    { id: 'contacts', label: 'Contacts', count: contacts.length },
  ]'''

content = content.replace(old_section, new_section)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Account Detail page to fetch real data from API")
