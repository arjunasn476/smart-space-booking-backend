// Code generators for reservasi. All three follow the exact formats
// shown in Kontrak API §III response examples.

function pad2(n) { return String(n).padStart(2, '0'); }
function pad4(n) { return String(n).padStart(4, '0'); }

// Format: BOOK-YYYYMMDD-XXXX  (e.g. BOOK-20260830-0012)
// XXXX is the reservation's own id, zero-padded to 4 digits.
function generateKodeBooking(tanggalReservasi, id) {
  const d = new Date(tanggalReservasi);
  const ymd = `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
  return `BOOK-${ymd}-${pad4(id)}`;
}

// Format: TICKET-<SLUG>-YYYYMMDD-XXXX (e.g. TICKET-MOKLET-20260830-0012)
// Slug = first word of the coworking name, uppercased, non-alphanumerics stripped.
function generateETicketNumber(namaCoworking, tanggalReservasi, id) {
  const slug = String(namaCoworking || 'SPACE')
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase() || 'SPACE';
  const d = new Date(tanggalReservasi);
  const ymd = `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
  return `TICKET-${slug}-${ymd}-${pad4(id)}`;
}

// Format: VERIFY-RESERVASI-<id>-<app_key>
function generateQrPayload(id, appKey) {
  return `VERIFY-RESERVASI-${id}-${appKey}`;
}

// Converts "HH:mm" into the Date object Prisma expects for a @db.Time()
// column (anchored to 1970-01-01 UTC).
function timeStringToDate(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

// Human label for a space type, matching /api/spaces/types labels.
const TIPE_LABELS = {
  desk: 'Personal Desk',
  meeting_room: 'Meeting Room',
  private_office: 'Private Office',
};

module.exports = {
  generateKodeBooking,
  generateETicketNumber,
  generateQrPayload,
  timeStringToDate,
  TIPE_LABELS,
};
