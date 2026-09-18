// signToken()/verifyToken() wrappers around jsonwebtoken.
// Two kinds of tokens flow through this app, distinguished by the
// `type` field inside the payload:
//   - { type: 'maker', makerId }              — App Maker's own login
//   - { type: 'user', userId, makerId, role }  — Member/Admin Space login
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
