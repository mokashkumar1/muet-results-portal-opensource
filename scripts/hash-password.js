const bcrypt = require('bcryptjs');

// Get password from CLI arguments
const password = process.argv[2];

if (!password) {
  console.error('\x1b[31mError: Please provide a password to hash.\x1b[0m');
  console.log('Usage: npm run hash-password <your_new_password>');
  process.exit(1);
}

const saltRounds = 10;

console.log('Hashing password...');
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('\x1b[31mError generating password hash:\x1b[0m', err);
    process.exit(1);
  }

  console.log('\n\x1b[32mSuccess! Password hashed successfully.\x1b[0m');
  console.log('\n------------------------------------------------------------');
  console.log('\x1b[36mAdd this variable to your Vercel Environment Variables:\x1b[0m');
  console.log('------------------------------------------------------------');
  console.log(`\x1b[33mADMIN_PASSWORD_HASH\x1b[0m = \x1b[32m${hash}\x1b[0m`);
  console.log('------------------------------------------------------------');
  
  // Generate a random JWT_SECRET too for utility
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('\n\x1b[36mAlso, add this secure random JWT_SECRET to Vercel:\x1b[0m');
  console.log('------------------------------------------------------------');
  console.log(`\x1b[33mJWT_SECRET\x1b[0m = \x1b[32m${jwtSecret}\x1b[0m`);
  console.log('------------------------------------------------------------\n');
});
