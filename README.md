# Smart Space Booking — Backend API

UKK RPL 2026/2027 Paket B — SMK Telkom Malang
Stack: **Node.js + Express + Prisma + PostgreSQL** (+ Swagger, direncanakan Sesi 7)

## 📅 Roadmap Pengerjaan

- [x] **Sesi 1** — Instalasi & setup, struktur folder + nama file lengkap (isi masih TODO)
- [ ] **Sesi 2** — Isi: utils, middleware, koneksi Prisma, format response baku
- [ ] **Sesi 3** — Isi: modul Maker (multi-tenancy) + Auth (register/login member & admin)
- [ ] **Sesi 4** — Isi: modul Spaces (katalog) + Diskon (katalog & promo)
- [ ] **Sesi 5** — Isi: modul Reservasi member (booking, overlap check, e-ticket)
- [ ] **Sesi 6** — Isi: modul Admin (profile, CRUD member/space/diskon, kelola reservasi, laporan)
- [ ] **Sesi 7** — Isi: Upload endpoints + Swagger (swagger-jsdoc + swagger-ui-express)
- [ ] **Sesi 8** — Testing end-to-end via Postman/Swagger UI, generate Postman collection
- [ ] **Sesi 9** — Deploy (env production, hosting, packaging final)

---

## ✅ Sesi 1 — Instalasi & Setup (SELESAI)

### 1. Prasyarat software

| Tool | Cek versi | Catatan |
|---|---|---|
| Node.js (LTS 20.x) | `node -v` | [nodejs.org](https://nodejs.org) |
| PostgreSQL 15/16 | `psql --version` | atau pakai Docker (lihat bawah) |
| VS Code | — | |
| Postman/Insomnia | — | untuk uji coba API |

### 2. Ekstensi VS Code yang disarankan

- **Prisma** (`Prisma.prisma`) — syntax highlight + format `schema.prisma`
- **DotENV** (`mikestead.dotenv`) — syntax highlight `.env`
- **ESLint** (opsional, kalau nanti mau linting)
- **Thunder Client** (opsional, alternatif Postman langsung di VS Code)
- **REST Client** (opsional)

### 3. Setup database PostgreSQL

Pilih salah satu:

**Opsi A — PostgreSQL lokal (sudah terinstall):**
```bash
psql -U postgres -c "CREATE DATABASE smart_space_booking;"
```

**Opsi B — Docker (kalau belum ada PostgreSQL lokal):**
```bash
docker run --name ssb-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smart_space_booking -p 5432:5432 -d postgres:16
```

### 4. Clone/buka project di VS Code, lalu install dependency

```bash
npm install
```

### 5. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env`, isi `DATABASE_URL` sesuai kredensial PostgreSQL kamu, dan tambahkan:
```
JWT_SECRET=ganti-dengan-string-acak-yang-panjang
JWT_EXPIRES_IN=7d
PORT=3000
```

### 6. Jalankan migration

```bash
npx prisma generate
npx prisma migrate deploy
```

Kalau sukses, semua tabel (`makers`, `users`, `member`, `space_owner`, `space`, `diskon`, `reservasi`) sudah ada di database kamu. Cek dengan:
```bash
npx prisma studio
```

### 7. Struktur folder yang sudah dibuat (Sesi 1)

```
smart-space-booking/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.js                    # TODO Sesi 2
│   ├── server.js                 # TODO Sesi 2
│   ├── lib/
│   │   └── prisma.js             # TODO Sesi 2
│   ├── utils/                    # TODO Sesi 2/3/4/5
│   ├── middlewares/               # TODO Sesi 2/3/7
│   ├── validators/                # TODO Sesi 3/4/5/6
│   ├── modules/
│   │   ├── maker/                # TODO Sesi 3
│   │   ├── auth/                 # TODO Sesi 3
│   │   ├── spaces/               # TODO Sesi 4
│   │   ├── diskon/               # TODO Sesi 4
│   │   ├── reservasi/            # TODO Sesi 5
│   │   ├── admin/                # TODO Sesi 6
│   │   └── upload/               # TODO Sesi 7
│   ├── routes/                    # TODO Sesi 2 (mount) - berkembang tiap sesi
│   └── docs/
│       └── swagger.js             # TODO Sesi 7
├── uploads/
│   ├── general/
│   ├── spaces/
│   └── members/
└── postman/                       # diisi Sesi 8
```

Setiap file yang masih kosong berisi komentar `// TODO — Sesi X` yang menandakan kapan file itu akan diisi.

⚠️ **Catatan penting:** Di akhir Sesi 1 ini, `npm run dev` **BELUM bisa dijalankan** karena `src/app.js` dan `src/server.js` masih kosong. Itu normal — baru akan jalan setelah Sesi 2 selesai.

---

## Reconciliation summary (ERD vs Kontrak API vs Bagian II prose)

*(carried over dari sesi migration sebelumnya — lihat komentar inline di `prisma/schema.prisma` untuk detail penuh)*

| # | Konflik | Resolusi |
|---|---|---|
| 1 | `space_owner.alamat`/`deskripsi` disebut di prosa tapi tidak ada di ERD & DTO | Dihapus |
| 2 | Field uang `DOUBLE` di ERD | `INTEGER` — sesuai §III.4 |
| 3 | `persentase_diskon` `DOUBLE` di ERD | `DECIMAL(5,2)` — bukan field uang |
| 4 | `tanggal_reservasi` `DATETIME` di ERD | `DATE` — sesuai contoh request/response |
| 5 | `reservasi.id_owner` | Tetap ada (denormalized), sesuai ERD |
| 6 | Tabel `detail_reservasi` di ERD | Di-flatten ke `reservasi`, sesuai response Contract |

⚠️ Konfirmasi ke pembimbing/penguji soal poin #6 sebelum submit final.
