// buildFotoUrl() — computes the public URL for a stored filename,
// matching Ketentuan Global §III.5 exactly: /uploads/<subfolder>/<file>.
function buildFotoUrl(req, subfolder, filename) {
  if (!filename) return null;
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${subfolder}/${filename}`;
}

module.exports = { buildFotoUrl };
