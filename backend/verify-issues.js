const axios = require('axios');

async function verifyIssues() {
  const baseUrl = 'http://localhost:4000';

  // 1. Login as Tenant
  console.log('1. Logging in as Tenant A...');
  let token;
  try {
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: 'tenant.a@demo.com',
      password: 'admin123',
    });
    console.log('   Login response data:', loginRes.data);
    token = loginRes.data.accessToken;
    if (!token) throw new Error('No accessToken in response');
    console.log('   Login successful, token:', token.substring(0, 20) + '...');
  } catch (e) {
    console.error('   Login failed:', e.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Get Profile & Contract to find Room ID
  console.log('2. Getting Profile to find Room ID...');
  let roomId;
  try {
    const profileRes = await axios.get(`${baseUrl}/auth/profile`, { headers });
    const contracts = profileRes.data.tenant.contracts;
    const activeContract = contracts.find((c) => c.isActive);
    if (activeContract) {
      roomId = activeContract.room.id;
      console.log(`   Found active contract for Room ID: ${roomId}`);
    } else {
      console.error('   No active contract found for Tenant A');
      return;
    }
  } catch (e) {
    console.error('   Get profile failed:', e.message);
    return;
  }

  // 3. Create Issue
  console.log('3. Creating a new Issue...');
  try {
    const createRes = await axios.post(
      `${baseUrl}/issues`,
      {
        title: 'Test Issue via Script',
        description: 'Testing priority and images',
        priority: 'HIGH',
        roomId: roomId,
        images: [
          'https://via.placeholder.com/150',
          'https://via.placeholder.com/200',
        ],
      },
      { headers },
    );
    console.log('   Issue created! ID:', createRes.data.id);
    console.log('   Priority:', createRes.data.priority); // Should be HIGH
    console.log('   Images:', createRes.data.images); // Should have 2 URLs
  } catch (e) {
    console.error('   Create issue failed:', e.response?.data || e.message);
  }

  // 4. List Issues
  console.log('4. Listing Issues for Room...');
  try {
    const listRes = await axios.get(`${baseUrl}/issues/room/${roomId}`, {
      headers,
    });
    const issues = listRes.data;
    console.log(`   Found ${issues.length} issues.`);
    const myIssue = issues.find((i) => i.title === 'Test Issue via Script');
    if (myIssue) {
      console.log('   Verified created issue exists in list.');
    } else {
      console.error('   Created issue NOT found in list.');
    }
  } catch (e) {
    console.error('   List issues failed:', e.message);
  }
}

verifyIssues();
