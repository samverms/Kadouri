const postgres = require('postgres');

// Try direct connection with correct username
const connectionStrings = [
  {
    host: 'db.chqlvpkqfgyaaqmhjwbq.supabase.co',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: 'Luminous@123-'
  },
  'postgresql://postgres:Luminous%40123-@db.chqlvpkqfgyaaqmhjwbq.supabase.co:5432/postgres',
];

async function testConnection(config, index) {
  console.log(`\nTesting connection ${index + 1}...`);
  console.log('Config:', typeof config === 'string' ? config : JSON.stringify(config, null, 2));
  try {
    const sql = postgres(config, { max: 1, idle_timeout: 20, connect_timeout: 10 });
    const result = await sql`SELECT current_database(), current_user, version()`;
    console.log(`✅ Success! Database: ${result[0].current_database}, User: ${result[0].current_user}`);
    console.log(`Version: ${result[0].version.substring(0, 50)}...`);
    await sql.end();
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    console.log(`Error code: ${error.code || 'N/A'}`);
    return false;
  }
}

async function testAll() {
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    if (success) {
      console.log('\n✅ Found working connection!');
      console.log('Config:', JSON.stringify(connectionStrings[i], null, 2));
      process.exit(0);
    }
  }
  console.log('\n❌ No working connection found');
  process.exit(1);
}

testAll();
