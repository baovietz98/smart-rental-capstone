const https = require('https');

const data = JSON.stringify({
  content: 'HD50 DEMO AUTO',
  transferAmount: 2000,
  referenceCode: 'FT' + Date.now(),
  transactionDate: new Date().toISOString(),
});

const options = {
  hostname: 'sepay-demo-1234.loca.lt',
  port: 443,
  path: '/transactions/webhook/sepay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
