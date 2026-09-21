# Smart Space Booking — Backend API

**UKK RPL 2026/2027 Paket B — SMK Telkom Malang**
Kategori: **Backend** — RESTful API untuk Sistem Reservasi Coworking Space & Workstation

---

## Deskripsi

Backend RESTful API untuk aplikasi reservasi coworking space (Smart Space Booking), mencakup:
- Multi-tenancy (App Maker) dengan isolasi data per siswa via `x-maker-key`
- Autentikasi JWT dua role: `member` dan `admin_space`
- Katalog space (Personal Desk, Meeting Room, Private Office) & ketersediaan real-time
- Kode promo/diskon dengan validasi masa berlaku
- Reservasi dengan kalkulasi harga otomatis & pencegahan bentrok jadwal
- Manajemen check-in/check-out & status pemesanan
- CRUD lengkap untuk member, space, dan diskon (sisi admin)
- Rekapitulasi pendapatan bulanan
- Upload foto (member, space, media umum)

Total **50 endpoint**, seluruhnya mengikuti Kontrak API modul UKK secara ketat (lihat bagian [Reconciliation Notes](#reconciliation-notes-erd-vs-kontrak-api) untuk beberapa penyesuaian yang sengaja diambil saat ERD dan Kontrak API berbeda).

## Stack

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validasi | Zod |
| Upload file | Multer |
| Dokumentasi | Swagger UI (OpenAPI 3.0) + Postman Collection |
| Hosting | Railway |

## Live Deployment

| Resource | URL |
|---|---|
| Base URL (Production) | `https://smart-space-booking-backend-production.up.railway.app` |
| Swagger UI (interaktif) | `https://smart-space-booking-backend-production.up.railway.app/docs` |
| OpenAPI JSON (raw) | `https://smart-space-booking-backend-production.up.railway.app/docs-json` |
| Health Check | `https://smart-space-booking-backend-production.up.railway.app/health` |

> Catatan: folder `uploads/` di Railway bersifat sementara (ephemeral) — file yang di-upload akan hilang saat redeploy/restart container. Untuk penyimpanan foto permanen di production sungguhan, disarankan pakai object storage terpisah (S3, Supabase Storage, dsb).

## Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js 20 LTS
- Akun PostgreSQL (lokal, Docker, atau Supabase — project ini pakai Supabase)

### 2. Clone & Install
```bash
git clone https://github.com/arjunasn476/smart-space-booking-backend.git
cd smart-space-booking-backend
npm install
```

### 3. Environment Variables
Copy `.env.example` menjadi `.env`, lalu isi:

| Variable | Contoh | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:6543/postgres?pgbouncer=true&connection_limit=5` | Connection string PostgreSQL. Kalau pakai Supabase, gunakan **Transaction pooler** (port 6543), bukan Direct Connection (port 5432) — lebih tahan terhadap restart berulang saat development |
| `JWT_SECRET` | string acak bebas, sepanjang mungkin | Kunci penandatanganan JWT |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token |
| `PORT` | `3000` | Port server (Railway/hosting lain biasanya override otomatis) |

### 4. Setup Database
```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Jalankan Server
```bash
npm run dev     # mode development (auto-restart via nodemon)
npm start        # mode production
```

Server berjalan di `http://localhost:3000` (atau sesuai `PORT`). Cek `http://localhost:3000/health` untuk memastikan server & koneksi database sudah benar.

## Dokumentasi API

Dua cara mengakses dokumentasi endpoint:

1. **Swagger UI** — buka `/docs` (lokal atau production). Interaktif, bisa langsung "Try it out" dengan tombol Authorize untuk isi `x-maker-key` dan Bearer token sekali untuk semua request.
2. **Postman Collection** — import `postman/smart-space-booking-full.postman_collection.json`. Sudah dilengkapi script otomatis: begitu Register/Login App Maker, Member, atau Admin Space dijalankan, token dan ID (`appKey`, `spaceId`, `diskonId`, dst) otomatis tersimpan ke collection variables — tidak perlu copy-paste manual.

## Struktur Project

```
smart-space-booking/
├── prisma/
│   ├── schema.prisma          # skema database + catatan reconciliation inline
│   └── migrations/
├── src/
│   ├── app.js                 # setup Express, middleware, Swagger
│   ├── server.js              # entry point
│   ├── lib/prisma.js          # Prisma Client singleton
│   ├── utils/                 # helper: response formatter, JWT, password hashing, dll
│   ├── middlewares/           # auth (maker key & JWT), validasi, error handler, upload
│   ├── validators/            # skema validasi Zod per modul
│   ├── modules/                # controller + routes, dikelompokkan per domain:
│   │   ├── maker/              #   App Maker (multi-tenancy)
│   │   ├── auth/                #   Register/login member & admin
│   │   ├── spaces/              #   Katalog space
│   │   ├── diskon/              #   Katalog & validasi promo
│   │   ├── reservasi/           #   Booking sisi member
│   │   ├── admin/               #   Semua endpoint /api/admin/*
│   │   └── upload/              #   Upload foto
│   ├── routes/index.js         # mount semua router
│   └── docs/openapi.json       # spec OpenAPI, sumber Swagger UI
├── postman/                    # Postman collection
└── uploads/                    # folder penyimpanan foto (general/spaces/members)
```

## Reconciliation Notes (ERD vs Kontrak API)

Dokumen soal UKK memiliki beberapa titik di mana ERD, Kontrak API, dan deskripsi fitur (Bagian II) tidak 100% konsisten satu sama lain. Prioritas yang diambil: **Kontrak API > ERD > deskripsi prosa**, karena Kontrak API adalah yang divalidasi langsung lewat Postman/Swagger saat penilaian.

| # | Area | Keputusan |
|---|---|---|
| 1 | `space_owner.alamat`/`deskripsi` disebut di prosa tapi tidak ada di ERD & DTO | Tidak dibuat — dua sumber teknis (ERD + Contract) sepakat tidak ada |
| 2 | Field uang (`harga_per_jam`, dst) `DOUBLE` di ERD | `INTEGER` — Ketentuan Global §III.4 mewajibkan integer untuk nilai Rupiah |
| 3 | `persentase_diskon` `DOUBLE` di ERD | `DECIMAL(5,2)` — bukan field uang, aturan §III.4 tidak berlaku |
| 4 | `tanggal_reservasi` `DATETIME` di ERD | `DATE` — semua contoh request/response di Contract pakai format tanggal saja |
| 5 | `reservasi.id_owner` ada di ERD, tidak pernah muncul standalone di response API | Tetap dibuat (denormalized), sesuai relasi ERD, tidak mengganggu response manapun |
| 6 | Tabel `detail_reservasi` di ERD | Di-flatten langsung ke tabel `reservasi`, mengikuti bentuk response Contract §III.16 yang sebenarnya diuji |
| 7 | Endpoint `/api/upload/spaces` & `/members`: tabel ringkasan bilang "Admin Space" saja, baris "Auth:" detail bilang cuma butuh `x-maker-key` | Ikut baris detail (lebih spesifik) — hanya `x-maker-key`, tidak wajib Bearer token |

Detail lengkap tiap keputusan ada sebagai komentar inline di `prisma/schema.prisma`.

## Business Logic Kunci

- **Kalkulasi reservasi**: `jam_selesai = jam_mulai + durasi_jam`, `total_harga_awal = harga_per_jam × durasi_jam`, `potongan_diskon` dihitung dari persentase diskon aktif, `total_bayar = total_harga_awal − potongan_diskon`. `harga_per_jam` di-snapshot saat transaksi dibuat, tidak berubah walau harga space diedit setelahnya.
- **Pencegahan bentrok jadwal**: validasi range waktu di application layer (tidak bisa pakai unique index DB biasa), dicek ulang setiap kali `POST /api/reservasi` dan `GET /api/spaces/availability`.
- **State machine status reservasi**: `belum_dikonfirm → disetujui → aktif → selesai`, atau `→ dibatalkan` dari status manapun sebelum `aktif`. Check-in hanya valid dari status `disetujui`; check-out hanya valid dari `aktif`.
- **Proteksi data historis**: `member` dan `space` yang masih punya riwayat reservasi tidak bisa dihapus (`ON DELETE RESTRICT`), sementara `diskon` boleh dihapus kapan saja karena totalnya sudah di-snapshot di tiap reservasi (`ON DELETE SET NULL`).

## Autentikasi

Dua mekanisme berjalan bersamaan di sebagian besar endpoint:

1. **Header `x-maker-key`** — wajib di hampir semua endpoint (kecuali root/health & sebagian endpoint Maker). Didapat dari `POST /api/maker/register`.
2. **Header `Authorization: Bearer <token>`** — wajib di endpoint yang butuh login (member/admin_space). Didapat dari `POST /api/auth/login`.

---

Dikembangkan oleh **Arjuna S. Notanubun** — SMK Telkom Malang, Rekayasa Perangkat Lunak.
