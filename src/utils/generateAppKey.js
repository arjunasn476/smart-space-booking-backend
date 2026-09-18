// Generates mk_<32hex> App Maker keys per Ketentuan Global §III.1
// example format ("mk_xxxxxxxxxxxx").
const crypto = require('crypto');

function generateAppKey() {
  return 'mk_' + crypto.randomBytes(16).toString('hex'); // 32 hex chars
}

module.exports = generateAppKey;
