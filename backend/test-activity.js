const axios = require('axios');

async function testActivity() {
  const baseURL = 'http://192.168.1.14:4000';

  const cases = [
    { name: 'All Buildings', params: { limit: 10 } },
    { name: 'Building 1', params: { buildingId: 1, limit: 10 } },
    { name: 'Building 2 (Green Valley)', params: { buildingId: 2, limit: 10 } },
    { name: 'Invalid Building', params: { buildingId: 'abc', limit: 10 } },
  ];

  for (const c of cases) {
    console.log(`Testing ${c.name}...`);
    try {
      const res = await axios.get(`${baseURL}/transactions/activity`, {
        params: c.params,
      });
      console.log(`Success: ${res.data.length} items`);
    } catch (err) {
      console.log(
        `Failed: ${err.message} - ${err.response?.data?.message || 'No message'}`,
      );
    }
  }
}

testActivity();
