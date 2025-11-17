const postgres = require('postgres');

const sql = postgres('postgresql://postgres.chqlvpkqfgyaaqmhjwbq:!lUMINOUS-123@aws-1-us-east-2.pooler.supabase.com:5432/postgres', {
  max: 1
});

async function resetDatabase() {
  console.log('Dropping all tables...');

  try {
    // Drop all tables in correct order (respecting foreign keys)
    await sql`DROP TABLE IF EXISTS email_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS order_lines CASCADE`;
    await sql`DROP TABLE IF EXISTS orders CASCADE`;
    await sql`DROP TABLE IF EXISTS contacts CASCADE`;
    await sql`DROP TABLE IF EXISTS addresses CASCADE`;
    await sql`DROP TABLE IF EXISTS accounts CASCADE`;
    await sql`DROP TABLE IF EXISTS products CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS audit_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS sync_maps CASCADE`;
    await sql`DROP TABLE IF EXISTS roles CASCADE`;
    await sql`DROP TABLE IF EXISTS permissions CASCADE`;
    await sql`DROP TABLE IF EXISTS role_permissions CASCADE`;
    await sql`DROP TABLE IF EXISTS user_roles CASCADE`;

    console.log('✅ All tables dropped successfully!');
    console.log('\nNow run: npm run migration:run');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetDatabase();
