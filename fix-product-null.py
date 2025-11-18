#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/products/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the problematic fullProductName calculation that happens before null check
content = content.replace(
    '''    })

  const fullProductName = [product.name, product.variety, product.grade]
    .filter(Boolean)
    .join(' - ')

  return (''',
    '''    })

  return ('''
)

# Update the QuickBooks tab to use getFullName() helper instead
content = content.replace(
    '<span className="text-sm font-medium text-gray-900">{fullProductName}</span>',
    '<span className="text-sm font-medium text-gray-900">{getFullName()}</span>'
)

# Write back
with open('apps/web/src/app/(dashboard)/products/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed product null reference error by removing fullProductName and using getFullName() helper")
