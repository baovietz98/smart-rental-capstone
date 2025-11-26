const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
console.log('Current Directory:', process.cwd());
console.log('Checking for .env at:', envPath);

if (fs.existsSync(envPath)) {
  console.log('.env file EXISTS.');
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env:', result.error);
  } else {
    console.log('.env loaded successfully.');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
  }
} else {
  console.error('.env file DOES NOT EXIST.');
}
