// Time helpers. jam_mulai/jam_selesai are stored as Prisma @db.Time()
// columns, which the pg driver returns as JS Date objects anchored to
// 1970-01-01 UTC — formatTime() converts that back to "HH:mm" strings
// matching the Contract's expected format.

function pad2(n) {
  return String(n).padStart(2, '0');
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// True if jam_mulai + durasi_jam would land at or past 24:00 — a
// booking crossing into the next calendar day. Neither the ERD nor
// Kontrak API define cross-midnight bookings (no field for an "end
// date" separate from the start date), so this is rejected outright
// rather than silently wrapping jam_selesai to "00:00" while leaving
// tanggal_reservasi on the original day — that combination used to
// produce a jam_selesai earlier than jam_mulai, which also broke the
// overlap-detection math in isOverlap().
function crossesMidnight(jamMulai, durasiJam) {
  return timeToMinutes(jamMulai) + durasiJam * 60 > 24 * 60;
}

function addHoursToTime(jamMulai, durasiJam) {
  const totalMinutes = timeToMinutes(jamMulai) + durasiJam * 60;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${pad2(endH)}:${pad2(endM)}`;
}

function isOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

function formatTime(dateObj) {
  const d = new Date(dateObj);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

module.exports = { addHoursToTime, timeToMinutes, isOverlap, formatTime, crossesMidnight };