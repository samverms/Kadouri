import 'dotenv/config';
import { supabase } from './src/db/supabase';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...\n');

  try {
    // Test 1: List all tables
    console.log('1. Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('accounts')
      .select('*')
      .limit(0);

    if (tablesError) {
      console.log('❌ Error accessing accounts table:', tablesError.message);
      console.log('\nMake sure you ran the migration SQL in Supabase SQL Editor!');
      process.exit(1);
    }

    console.log('✅ Successfully connected to accounts table');

    // Test 2: Check all tables exist
    const tablesToCheck = [
      'accounts',
      'addresses',
      'contacts',
      'products',
      'orders',
      'order_lines',
      'users',
    ];

    console.log('\n2. Verifying all tables exist...');
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        console.log(`❌ Table "${table}" not found`);
      } else {
        console.log(`✅ Table "${table}" exists`);
      }
    }

    // Test 3: Try to count records
    console.log('\n3. Checking record counts...');
    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`   ${table}: ${count || 0} records`);
      }
    }

    console.log('\n✅ Supabase connection test successful!');
    console.log('\nYou can now use the Supabase client for database operations.');
    process.exit(0);
  } catch (error: any) {
    console.log('\n❌ Connection test failed!');
    console.log('Error:', error.message);
    console.log('\nPlease check:');
    console.log('1. SUPABASE_URL and SUPABASE_ANON_KEY are set in .env');
    console.log('2. You ran the migration SQL in Supabase SQL Editor');
    console.log('3. Your Supabase project is active');
    process.exit(1);
  }
}

testSupabaseConnection();
