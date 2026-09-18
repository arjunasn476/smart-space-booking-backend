// bcrypt hash/compare helpers. Salt rounds fixed at 10 — a good
// balance between security and response time for this exam-scale app.
const bcrypt = require('bcryptjs');

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
