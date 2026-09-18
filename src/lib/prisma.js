// Shared PrismaClient singleton — import this everywhere instead of
// creating `new PrismaClient()` in every file (avoids exhausting DB
// connections, especially with dev hot-reload via nodemon).
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
