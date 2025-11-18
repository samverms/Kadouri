const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:2000/api/accounts?limit=5');
    const data = await response.json();

    console.log('Total accounts returned:', data.length);
    console.log('\nFirst account:');
    console.log(JSON.stringify(data[0], null, 2));

    if (data[0]) {
      console.log('\nContacts:', data[0].contacts?.length || 0);
      console.log('Addresses:', data[0].addresses?.length || 0);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
