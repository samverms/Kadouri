import { db } from './index'
import { roles, permissions, rolePermissions } from './schema'

const modules = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'accounts', label: 'Accounts' },
  { name: 'orders', label: 'Orders' },
  { name: 'products', label: 'Products' },
  { name: 'invoices', label: 'Invoices' },
  { name: 'contracts', label: 'Contracts' },
  { name: 'reports', label: 'Reports' },
  { name: 'email', label: 'Email' },
  { name: 'users', label: 'User Management' },
  { name: 'settings', label: 'Settings' },
]

const actions = ['view', 'create', 'edit', 'delete', 'export']

async function seedRolesAndPermissions() {
  console.log('Seeding roles and permissions...')

  const permissionsList = []
  for (const module of modules) {
    for (const action of actions) {
      const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1)
      permissionsList.push({
        module: module.name,
        action,
        description: actionCapitalized + ' ' + module.label,
      })
    }
  }

  console.log('Creating permissions...')
  const createdPermissions = await db.insert(permissions).values(permissionsList).returning()
  console.log('Created ' + createdPermissions.length + ' permissions')

  console.log('Creating roles...')
  const [adminRole] = await db
    .insert(roles)
    .values({
      name: 'Admin',
      description: 'Full system access - can manage everything including users and settings',
    })
    .returning()

  const [salesRole] = await db
    .insert(roles)
    .values({
      name: 'Sales',
      description: 'Sales team - can manage accounts, orders, products, and view reports',
    })
    .returning()

  const [backOfficeRole] = await db
    .insert(roles)
    .values({
      name: 'BackOffice',
      description: 'Back office operations - can view and manage orders, accounts, and invoices',
    })
    .returning()

  const [accountantRole] = await db
    .insert(roles)
    .values({
      name: 'Accountant',
      description: 'Finance team - can view/manage invoices, payments, and financial reports',
    })
    .returning()

  console.log('Created 4 roles')

  console.log('Assigning permissions to Admin...')
  const adminPermissions = createdPermissions.map((perm) => ({
    roleId: adminRole.id,
    permissionId: perm.id,
  }))
  await db.insert(rolePermissions).values(adminPermissions)
  console.log('Admin has all permissions')

  console.log('Assigning permissions to Sales...')
  const salesModules = ['dashboard', 'accounts', 'orders', 'products', 'email', 'reports']
  const salesPerms = createdPermissions.filter((p) => salesModules.includes(p.module))
  const salesRolePerms = salesPerms.map((perm) => ({
    roleId: salesRole.id,
    permissionId: perm.id,
  }))
  await db.insert(rolePermissions).values(salesRolePerms)
  console.log('Sales permissions assigned')

  console.log('Assigning permissions to BackOffice...')
  const backOfficeModules = ['dashboard', 'accounts', 'orders', 'products', 'contracts', 'email']
  const backOfficePerms = createdPermissions.filter((p) => backOfficeModules.includes(p.module))
  const backOfficeRolePerms = backOfficePerms.map((perm) => ({
    roleId: backOfficeRole.id,
    permissionId: perm.id,
  }))
  await db.insert(rolePermissions).values(backOfficeRolePerms)
  console.log('BackOffice permissions assigned')

  console.log('Assigning permissions to Accountant...')
  const accountantModules = ['dashboard', 'invoices', 'reports']
  const accountantActions = ['view', 'edit', 'export']
  const accountantPerms = createdPermissions.filter(
    (p) => accountantModules.includes(p.module) && accountantActions.includes(p.action)
  )
  const accountantViewPerms = createdPermissions.filter(
    (p) => ['orders', 'accounts'].includes(p.module) && p.action === 'view'
  )
  const accountantRolePerms = [...accountantPerms, ...accountantViewPerms].map((perm) => ({
    roleId: accountantRole.id,
    permissionId: perm.id,
  }))
  await db.insert(rolePermissions).values(accountantRolePerms)
  console.log('Accountant permissions assigned')

  console.log('Roles and permissions seeded successfully!')
}

seedRolesAndPermissions()
  .then(() => {
    console.log('Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
