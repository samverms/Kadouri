const postgres = require('postgres');

// Test with new password
const config = {
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.chqlvpkqfgyaaqmhjwbq',
  password: '!lUMINOUS-123'
};

async function testConnection() {
  console.log('Testing connection with new password...');
  try {
    const sql = postgres(config, { max: 1, idle_timeout: 20, connect_timeout: 10 });
    const result = await sql`SELECT current_database(), current_user, version()`;
    console.log(`\n✅ SUCCESS! Connection established!`);
    console.log(`Database: ${result[0].current_database}`);
    console.log(`User: ${result[0].current_user}`);
    console.log(`Version: ${result[0].version.substring(0, 60)}...`);
    await sql.end();
    return true;
  } catch (error) {
    console.log(`\n❌ Failed: ${error.message}`);
    console.log(`Error code: ${error.code || 'N/A'}`);
    if (error.severity) console.log(`Severity: ${error.severity}`);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
