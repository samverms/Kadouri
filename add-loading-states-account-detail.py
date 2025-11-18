#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add loading and error states before the header
old_return = '''  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>'''

new_return = '''  if (isLoading) {
    return (
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading account details...</p>
        </div>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error || 'Account not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>'''

content = content.replace(old_return, new_return)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added loading and error states to Account Detail page")
