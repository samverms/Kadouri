import 'dotenv/config';
import { supabase } from './src/db/supabase';

async function verifyEnterpriseTables() {
  console.log('🔍 Verifying Enterprise Database Schema...\n');

  const enterpriseTables = [
    // System Configuration
    'organizations',
    'system_settings',
    'email_templates',

    // User Management
    'users',
    'user_permissions',
    'user_activity_log',

    // Account Management
    'accounts',
    'addresses',
    'contacts',

    // Product Catalog
    'product_categories',
    'products',

    // Order Management
    'orders',
    'order_lines',
    'order_status_history',

    // Invoicing & Payments
    'invoices',
    'invoice_lines',
    'payments',
    'payment_applications',

    // Email & Communication
    'email_queue',
    'email_activity_log',

    // QuickBooks Integration
    'quickbooks_connections',
    'sync_history',
    'entity_sync_map',
    'quickbooks_webhooks',

    // Documents
    'documents',

    // Audit & Notifications
    'audit_logs',
    'notifications',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const table of enterpriseTables) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table.padEnd(30)} - NOT FOUND`);
      failCount++;
    } else {
      console.log(`✅ ${table.padEnd(30)} - ${count || 0} records`);
      successCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Tables Found: ${successCount}/${enterpriseTables.length}`);
  console.log(`❌ Tables Missing: ${failCount}/${enterpriseTables.length}`);

  if (failCount === 0) {
    console.log('\n🎉 All enterprise tables created successfully!');
    console.log('\n📊 Database Ready for Production!');
  } else {
    console.log('\n⚠️ Some tables are missing. Please check the migration.');
  }
}

verifyEnterpriseTables();
