const crypto = require('crypto');
const password = process.argv[2];
if (!password) { console.error('Usage: node hash-password.cjs <password>'); process.exit(1); }
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('Add to .env.local:');
console.log('VITE_APP_PASSWORD_HASH=' + hash);
