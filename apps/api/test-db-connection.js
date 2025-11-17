const postgres = require('postgres');

// Try different connection formats
const connectionStrings = [
  'postgresql://postgres.chqlvpkqfgyaaqmhjwbq:Luminous%40123-@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.chqlvpkqfgyaaqmhjwbq:Luminous%40123-@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  {
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    username: 'postgres.chqlvpkqfgyaaqmhjwbq',
    password: 'Luminous@123-'
  }
];

async function testConnection(config, index) {
  console.log(`\nTesting connection ${index + 1}...`);
  try {
    const sql = postgres(config, { max: 1 });
    const result = await sql`SELECT current_database(), current_user`;
    console.log(`✅ Success! Database: ${result[0].current_database}, User: ${result[0].current_user}`);
    await sql.end();
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
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
