#!/usr/bin/env python3

# Read the file
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the contact form to use the handler and state
old_contact_form = '''              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input placeholder="John Smith" />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input type="tel" placeholder="(916) 555-0123" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Add Contact
                    </Button>'''

new_contact_form = '''              <CardContent>
                <form className="space-y-4" onSubmit={handleAddContact}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="John Smith"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={contactFormData.isPrimary}
                          onChange={(e) => setContactFormData({...contactFormData, isPrimary: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as primary</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      placeholder="(916) 555-0123"
                      value={contactFormData.phone}
                      onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formSubmitting}>
                      {formSubmitting ? 'Adding...' : 'Add Contact'}
                    </Button>'''

content = content.replace(old_contact_form, new_contact_form)

# Write back
with open('apps/web/src/app/(dashboard)/accounts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Implemented Add Contact functionality with API integration")
