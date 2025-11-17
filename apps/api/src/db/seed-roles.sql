-- Seed Roles and Permissions
-- Run this in Supabase SQL Editor

-- Insert Permissions (10 modules x 5 actions = 50 permissions)
INSERT INTO permissions (module, action, description) VALUES
-- Dashboard
('dashboard', 'view', 'View Dashboard'),
('dashboard', 'create', 'Create Dashboard'),
('dashboard', 'edit', 'Edit Dashboard'),
('dashboard', 'delete', 'Delete Dashboard'),
('dashboard', 'export', 'Export Dashboard'),
-- Accounts
('accounts', 'view', 'View Accounts'),
('accounts', 'create', 'Create Accounts'),
('accounts', 'edit', 'Edit Accounts'),
('accounts', 'delete', 'Delete Accounts'),
('accounts', 'export', 'Export Accounts'),
-- Orders
('orders', 'view', 'View Orders'),
('orders', 'create', 'Create Orders'),
('orders', 'edit', 'Edit Orders'),
('orders', 'delete', 'Delete Orders'),
('orders', 'export', 'Export Orders'),
-- Products
('products', 'view', 'View Products'),
('products', 'create', 'Create Products'),
('products', 'edit', 'Edit Products'),
('products', 'delete', 'Delete Products'),
('products', 'export', 'Export Products'),
-- Invoices
('invoices', 'view', 'View Invoices'),
('invoices', 'create', 'Create Invoices'),
('invoices', 'edit', 'Edit Invoices'),
('invoices', 'delete', 'Delete Invoices'),
('invoices', 'export', 'Export Invoices'),
-- Contracts
('contracts', 'view', 'View Contracts'),
('contracts', 'create', 'Create Contracts'),
('contracts', 'edit', 'Edit Contracts'),
('contracts', 'delete', 'Delete Contracts'),
('contracts', 'export', 'Export Contracts'),
-- Reports
('reports', 'view', 'View Reports'),
('reports', 'create', 'Create Reports'),
('reports', 'edit', 'Edit Reports'),
('reports', 'delete', 'Delete Reports'),
('reports', 'export', 'Export Reports'),
-- Email
('email', 'view', 'View Email'),
('email', 'create', 'Create Email'),
('email', 'edit', 'Edit Email'),
('email', 'delete', 'Delete Email'),
('email', 'export', 'Export Email'),
-- Users
('users', 'view', 'View User Management'),
('users', 'create', 'Create User Management'),
('users', 'edit', 'Edit User Management'),
('users', 'delete', 'Delete User Management'),
('users', 'export', 'Export User Management'),
-- Settings
('settings', 'view', 'View Settings'),
('settings', 'create', 'Create Settings'),
('settings', 'edit', 'Edit Settings'),
('settings', 'delete', 'Delete Settings'),
('settings', 'export', 'Export Settings');

-- Insert Roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system access - can manage everything including users and settings'),
('Sales', 'Sales team - can manage accounts, orders, products, and view reports'),
('BackOffice', 'Back office operations - can view and manage orders, accounts, and invoices'),
('Accountant', 'Finance team - can view/manage invoices, payments, and financial reports');

-- Assign ALL permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin';

-- Assign permissions to Sales (dashboard, accounts, orders, products, email, reports - all actions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Sales'
AND p.module IN ('dashboard', 'accounts', 'orders', 'products', 'email', 'reports');

-- Assign permissions to BackOffice (dashboard, accounts, orders, products, contracts, email - all actions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'BackOffice'
AND p.module IN ('dashboard', 'accounts', 'orders', 'products', 'contracts', 'email');

-- Assign permissions to Accountant (dashboard, invoices, reports - view/edit/export only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Accountant'
AND (
  (p.module IN ('dashboard', 'invoices', 'reports') AND p.action IN ('view', 'edit', 'export'))
  OR (p.module IN ('orders', 'accounts') AND p.action = 'view')
);

-- Verify the setup
SELECT 
  r.name as role,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name
ORDER BY r.name;
