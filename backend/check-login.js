const axios = require('axios');

async function testLogin() {
  const url = 'http://localhost:4000/auth/login';

  console.log('Testing Login...');

  // 1. Wrong Email
  try {
    console.log('1. Testing Wrong Email...');
    await axios.post(url, { email: 'wrong@example.com', password: '123' });
  } catch (e) {
    console.log('-> Response:', e.response?.data?.message || e.message);
  }

  // 2. Wrong Password
  try {
    console.log('2. Testing Wrong Password...');
    await axios.post(url, {
      email: 'tenant.a@demo.com',
      password: 'wrongpassword',
    });
  } catch (e) {
    console.log('-> Response:', e.response?.data?.message || e.message);
  }

  // 3. Wrong Phone
  try {
    console.log('3. Testing Wrong Phone...');
    await axios.post(url, { phoneNumber: '0999999999', password: '123' });
  } catch (e) {
    console.log('-> Response:', e.response?.data?.message || e.message);
  }
}

testLogin();
