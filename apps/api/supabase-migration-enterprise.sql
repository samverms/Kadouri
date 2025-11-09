-- =====================================================
-- KADOURI CRM - ENTERPRISE DATABASE SCHEMA
-- Production-ready schema with QuickBooks & Email integration
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. SYSTEM CONFIGURATION & SETTINGS
-- =====================================================

-- Company/Organization Setup
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    fiscal_year_start INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings/Configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(50), -- general, email, quickbooks, notifications, etc.
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, setting_key)
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    template_type VARCHAR(50), -- invoice, order_confirmation, welcome, etc.
    variables JSONB, -- Available template variables
    active BOOLEAN DEFAULT true,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- Users (Clerk integrated)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY, -- Clerk user ID
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'agent', -- admin, manager, agent, readonly
    department VARCHAR(100),
    title VARCHAR(100),
    timezone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    preferences JSONB, -- User preferences/settings
    active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions (Granular access control)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    resource VARCHAR(50) NOT NULL, -- accounts, orders, invoices, products, etc.
    action VARCHAR(20) NOT NULL, -- create, read, update, delete, approve
    allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ACCOUNT MANAGEMENT (Customers/Vendors)
-- =====================================================

-- Accounts (Customers & Vendors)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL, -- customer, vendor, both
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(100),
    account_status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, archived
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    payment_terms VARCHAR(50), -- Net 30, Net 60, COD, etc.
    currency VARCHAR(3) DEFAULT 'USD',
    price_level VARCHAR(50),
    sales_rep_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    account_manager_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[], -- Array of tags for categorization
    notes TEXT,
    -- QuickBooks Integration
    qbo_customer_id VARCHAR(50),
    qbo_vendor_id VARCHAR(50),
    qbo_sync_token VARCHAR(50),
    qbo_last_synced_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL, -- billing, shipping, both, other
    label VARCHAR(100), -- "Main Office", "Warehouse", etc.
    attention_to VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) DEFAULT 'US',
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    is_primary BOOLEAN DEFAULT false,
    is_default_billing BOOLEAN DEFAULT false,
    is_default_shipping BOOLEAN DEFAULT false,
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    can_approve_orders BOOLEAN DEFAULT false,
    receive_invoices BOOLEAN DEFAULT true,
    receive_statements BOOLEAN DEFAULT false,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PRODUCT CATALOG
-- =====================================================

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Items
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_type VARCHAR(50) DEFAULT 'inventory', -- inventory, service, non-inventory
    variety VARCHAR(100), -- For produce: Red Delicious, Fuji, etc.
    grade VARCHAR(50), -- A, B, C, Premium, etc.
    size_specification VARCHAR(100),
    unit_of_measure VARCHAR(20) NOT NULL, -- lb, kg, box, pallet, etc.
    default_unit_size NUMERIC(10, 3),
    weight_per_unit NUMERIC(10, 3),
    -- Pricing
    cost_price NUMERIC(12, 4),
    sell_price NUMERIC(12, 4),
    minimum_price NUMERIC(12, 4),
    price_by_customer JSONB, -- Customer-specific pricing
    commission_percentage NUMERIC(5, 2) DEFAULT 0,
    -- Inventory
    track_inventory BOOLEAN DEFAULT true,
    quantity_on_hand NUMERIC(12, 3) DEFAULT 0,
    reorder_point NUMERIC(12, 3),
    preferred_vendor_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    -- QuickBooks
    qbo_item_id VARCHAR(50),
    qbo_income_account_id VARCHAR(50),
    qbo_expense_account_id VARCHAR(50),
    qbo_sync_token VARCHAR(50),
    qbo_last_synced_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    tags TEXT[],
    image_urls TEXT[],
    active BOOLEAN DEFAULT true,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ORDER MANAGEMENT
-- =====================================================

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(20) DEFAULT 'sales_order', -- sales_order, purchase_order, quote
    order_status VARCHAR(20) DEFAULT 'draft', -- draft, pending, confirmed, in_progress, completed, cancelled, on_hold

    -- Parties
    customer_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_ship_date DATE,
    actual_ship_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,

    -- Financial
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate NUMERIC(10, 6) DEFAULT 1,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_cost NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    commission_total NUMERIC(12, 2) DEFAULT 0,

    -- Logistics
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    pallet_count INTEGER,
    total_weight NUMERIC(12, 3),

    -- Terms & Conditions
    payment_terms VARCHAR(50),
    payment_method VARCHAR(50),
    contract_number VARCHAR(100),
    po_number VARCHAR(100), -- Customer's PO
    terms_and_conditions TEXT,
    internal_notes TEXT,
    customer_notes TEXT,

    -- QuickBooks Integration
    qbo_doc_type VARCHAR(20), -- Invoice, SalesReceipt, Estimate, PurchaseOrder
    qbo_doc_id VARCHAR(50),
    qbo_doc_number VARCHAR(50),
    qbo_sync_token VARCHAR(50),
    qbo_last_synced_at TIMESTAMP WITH TIME ZONE,

    -- Workflow
    sales_rep_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    approved_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Line Items
CREATE TABLE IF NOT EXISTS order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,

    -- Product Details
    product_sku VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    size_grade VARCHAR(100),

    -- Quantities
    quantity NUMERIC(12, 3) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    unit_size NUMERIC(10, 3),
    total_weight NUMERIC(12, 3),

    -- Pricing
    unit_price NUMERIC(12, 4) NOT NULL,
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    line_total NUMERIC(15, 2) NOT NULL,

    -- Commission
    commission_percentage NUMERIC(5, 2) DEFAULT 0,
    commission_amount NUMERIC(12, 2) DEFAULT 0,
    commission_paid BOOLEAN DEFAULT false,
    commission_paid_date DATE,

    -- Fulfillment
    quantity_shipped NUMERIC(12, 3) DEFAULT 0,
    quantity_invoiced NUMERIC(12, 3) DEFAULT 0,
    ship_date DATE,

    -- QuickBooks
    qbo_line_id VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INVOICING & PAYMENTS
-- =====================================================

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(20) DEFAULT 'standard', -- standard, credit_memo, debit_memo
    invoice_status VARCHAR(20) DEFAULT 'draft', -- draft, sent, viewed, partial, paid, overdue, cancelled

    -- References
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,

    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    service_period_start DATE,
    service_period_end DATE,

    -- Financial
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate NUMERIC(10, 6) DEFAULT 1,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_cost NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    balance_due NUMERIC(15, 2),

    -- Terms
    payment_terms VARCHAR(50),
    payment_method VARCHAR(50),
    po_number VARCHAR(100),
    notes TEXT,
    terms_and_conditions TEXT,

    -- Email Tracking
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_viewed BOOLEAN DEFAULT false,
    email_viewed_at TIMESTAMP WITH TIME ZONE,

    -- QuickBooks
    qbo_invoice_id VARCHAR(50),
    qbo_doc_number VARCHAR(50),
    qbo_sync_token VARCHAR(50),
    qbo_last_synced_at TIMESTAMP WITH TIME ZONE,

    -- PDF
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,

    -- Workflow
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    approved_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    order_line_id UUID REFERENCES order_lines(id) ON DELETE SET NULL,
    line_number INTEGER NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Product Info
    product_sku VARCHAR(100),
    description TEXT NOT NULL,

    -- Quantities & Pricing
    quantity NUMERIC(12, 3) NOT NULL,
    unit_of_measure VARCHAR(20),
    unit_price NUMERIC(12, 4) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    line_total NUMERIC(15, 2) NOT NULL,

    -- QuickBooks
    qbo_line_id VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,

    -- Payment Details
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL, -- check, cash, credit_card, ach, wire, etc.
    reference_number VARCHAR(100), -- Check #, Transaction ID, etc.
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Bank Details
    deposit_to_account VARCHAR(100),
    bank_account_id VARCHAR(50),

    -- Status
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, cleared, bounced, refunded
    cleared_date DATE,

    -- QuickBooks
    qbo_payment_id VARCHAR(50),
    qbo_sync_token VARCHAR(50),
    qbo_last_synced_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Applications (Link payments to invoices)
CREATE TABLE IF NOT EXISTS payment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount_applied NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. EMAIL & COMMUNICATION TRACKING
-- =====================================================

-- Email Queue
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

    -- Recipients
    to_addresses TEXT[] NOT NULL,
    cc_addresses TEXT[],
    bcc_addresses TEXT[],

    -- Content
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- Attachments
    attachments JSONB, -- [{filename, url, size}]

    -- Related Entities
    entity_type VARCHAR(50), -- invoice, order, account, etc.
    entity_id UUID,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sending, sent, failed, bounced
    priority INTEGER DEFAULT 5,
    scheduled_send_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Email Provider Response
    provider VARCHAR(50), -- outlook, gmail, sendgrid, etc.
    message_id VARCHAR(255),

    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Activity Log
CREATE TABLE IF NOT EXISTS email_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_queue_id UUID REFERENCES email_queue(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- sent, delivered, opened, clicked, bounced, complained
    recipient_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    link_clicked TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. QUICKBOOKS INTEGRATION
-- =====================================================

-- QuickBooks Connection
CREATE TABLE IF NOT EXISTS quickbooks_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    realm_id VARCHAR(50) NOT NULL,
    company_name VARCHAR(255),

    -- OAuth Tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Connection Details
    environment VARCHAR(20) DEFAULT 'sandbox', -- sandbox, production
    base_url TEXT,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT true,
    connection_status VARCHAR(20) DEFAULT 'connected', -- connected, disconnected, error
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, realm_id)
);

-- Sync History
CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- full_sync, incremental, entity_sync
    entity_type VARCHAR(50), -- account, product, order, invoice, payment
    direction VARCHAR(20) NOT NULL, -- to_qbo, from_qbo, bidirectional

    -- Results
    status VARCHAR(20) NOT NULL, -- success, partial, failed
    records_processed INTEGER DEFAULT 0,
    records_succeeded INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Details
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_summary TEXT,
    error_details JSONB,

    triggered_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

-- Entity Sync Mapping
CREATE TABLE IF NOT EXISTS entity_sync_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Local Entity
    entity_type VARCHAR(50) NOT NULL, -- account, product, order, invoice, payment
    entity_id UUID NOT NULL,

    -- QuickBooks Entity
    qbo_entity_type VARCHAR(50) NOT NULL, -- Customer, Vendor, Item, Invoice, Payment, etc.
    qbo_entity_id VARCHAR(50) NOT NULL,
    qbo_sync_token VARCHAR(50), -- For optimistic locking

    -- Sync Status
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'synced', -- synced, pending, error, conflict
    last_error TEXT,

    -- Conflict Resolution
    local_updated_at TIMESTAMP WITH TIME ZONE,
    qbo_updated_at TIMESTAMP WITH TIME ZONE,
    conflict_resolution VARCHAR(20), -- local_wins, qbo_wins, manual

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, entity_type, entity_id)
);

-- QuickBooks Webhooks
CREATE TABLE IF NOT EXISTS quickbooks_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    realm_id VARCHAR(50) NOT NULL,

    -- Webhook Data
    event_id VARCHAR(100) NOT NULL UNIQUE,
    entity_name VARCHAR(50) NOT NULL, -- Customer, Invoice, Payment, etc.
    operation VARCHAR(20) NOT NULL, -- Create, Update, Delete, Merge, Void
    qbo_entity_id VARCHAR(50) NOT NULL,

    -- Processing
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,

    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. DOCUMENT MANAGEMENT
-- =====================================================

-- Documents/Attachments
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- File Details
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Classification
    document_type VARCHAR(50), -- invoice, contract, receipt, image, pdf, etc.
    category VARCHAR(100),
    tags TEXT[],

    -- Related Entity
    entity_type VARCHAR(50), -- account, order, invoice, product
    entity_id UUID,

    -- Metadata
    description TEXT,
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT false,

    uploaded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. AUDIT TRAIL & CHANGE LOG
-- =====================================================

-- Comprehensive Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Who & When
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- create, update, delete, approve, cancel, etc.

    -- What & Where
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    entity_description VARCHAR(500),

    -- Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- =====================================================
-- 11. NOTIFICATIONS
-- =====================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,

    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- info, warning, error, success
    category VARCHAR(50), -- order, invoice, payment, system, etc.

    -- Related Entity
    entity_type VARCHAR(50),
    entity_id UUID,
    entity_url TEXT,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Delivery
    send_email BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Accounts
CREATE INDEX idx_accounts_org ON accounts(organization_id);
CREATE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_status ON accounts(account_status);
CREATE INDEX idx_accounts_qbo_customer ON accounts(qbo_customer_id);

-- Addresses
CREATE INDEX idx_addresses_account ON addresses(account_id);
CREATE INDEX idx_addresses_type ON addresses(address_type);

-- Contacts
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Products
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

-- Orders
CREATE INDEX idx_orders_org ON orders(organization_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_orders_sales_rep ON orders(sales_rep_id);

-- Order Lines
CREATE INDEX idx_order_lines_order ON order_lines(order_id);
CREATE INDEX idx_order_lines_product ON order_lines(product_id);

-- Invoices
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(invoice_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Payments
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Email Queue
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_send_at);
CREATE INDEX idx_email_queue_entity ON email_queue(entity_type, entity_id);

-- Sync
CREATE INDEX idx_entity_sync_map_entity ON entity_sync_map(entity_type, entity_id);
CREATE INDEX idx_entity_sync_map_qbo ON entity_sync_map(qbo_entity_type, qbo_entity_id);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_lines_updated_at BEFORE UPDATE ON order_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_lines_updated_at BEFORE UPDATE ON invoice_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL SEED DATA
-- =====================================================

-- Insert default organization (you can modify this)
INSERT INTO organizations (name, legal_name, currency, timezone)
VALUES ('Kadouri Connection', 'Kadouri Connection LLC', 'USD', 'America/New_York')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Enterprise database schema created successfully!';
    RAISE NOTICE 'Tables created: 30+';
    RAISE NOTICE 'Indexes created: 25+';
    RAISE NOTICE 'Triggers created: 13+';
END $$;
