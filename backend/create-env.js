const fs = require('fs');
const content = 'DATABASE_URL="postgresql://admin:admin@localhost:5432/quanlytro_db?schema=public"';
fs.writeFileSync('.env', content, 'utf8');
console.log('.env file created successfully with UTF-8 encoding.');
