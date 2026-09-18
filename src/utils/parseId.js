// Safely parses a route/query param expected to be a numeric database
// ID into a BigInt (Prisma's ID type here). Throws a clean 400 AppError
// instead of letting `BigInt("abc")` throw a raw, unhandled SyntaxError.
const { AppError } = require('./AppError');

function parseId(value, label = 'ID') {
  if (value === undefined || value === null || value === '' || !/^\d+$/.test(String(value))) {
    throw new AppError(400, `${label} tidak valid!`, 'Bad Request');
  }
  return BigInt(value);
}

module.exports = parseId;
