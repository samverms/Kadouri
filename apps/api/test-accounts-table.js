const postgres = require('postgres');

const sql = postgres('postgresql://postgres.chqlvpkqfgyaaqmhjwbq:!lUMINOUS-123@aws-1-us-east-2.pooler.supabase.com:5432/postgres', {
  max: 1
});

async function testAccountsTable() {
  try {
    console.log('Testing accounts table...\n');

    // Check table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position
    `;

    console.log('✅ Accounts table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    // Check count
    const result = await sql`SELECT COUNT(*) as count FROM accounts`;
    console.log(`\n✅ Current accounts count: ${result[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testAccountsTable();
