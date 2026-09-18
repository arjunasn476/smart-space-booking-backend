// Time helpers. jam_mulai/jam_selesai are stored as Prisma @db.Time()
// columns, which the pg driver returns as JS Date objects anchored to
// 1970-01-01 UTC — formatTime() converts that back to "HH:mm" strings
// matching the Contract's expected format.

function pad2(n) {
  return String(n).padStart(2, '0');
}

function addHoursToTime(jamMulai, durasiJam) {
  const [h, m] = jamMulai.split(':').map(Number);
  const totalMinutes = h * 60 + m + durasiJam * 60;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${pad2(endH)}:${pad2(endM)}`;
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

function formatTime(dateObj) {
  const d = new Date(dateObj);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

module.exports = { addHoursToTime, timeToMinutes, isOverlap, formatTime };
