// Server bootstrap. Kept separate from app.js so app.js can be
// imported by test files later without actually binding a port.
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Coworking Space Backend API running on http://localhost:${PORT}`);
  console.log(`Cek: http://localhost:${PORT}/health`);
});
