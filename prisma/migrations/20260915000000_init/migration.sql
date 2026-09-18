-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin_space', 'member');

-- CreateEnum
CREATE TYPE "TipeSpace" AS ENUM ('desk', 'meeting_room', 'private_office');

-- CreateEnum
CREATE TYPE "StatusReservasi" AS ENUM ('belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan');

-- CreateTable
CREATE TABLE "makers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "app_key" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "makers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "maker_id" BIGINT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" BIGSERIAL NOT NULL,
    "id_user" BIGINT NOT NULL,
    "maker_id" BIGINT NOT NULL,
    "nama_member" VARCHAR(100) NOT NULL,
    "instansi" VARCHAR(100) NOT NULL,
    "alamat" TEXT NOT NULL,
    "telp" VARCHAR(20) NOT NULL,
    "foto" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- RECONCILIATION LOG #1: no alamat/deskripsi columns (dropped — see
-- schema.prisma comment on model SpaceOwner for full justification).
CREATE TABLE "space_owner" (
    "id" BIGSERIAL NOT NULL,
    "id_user" BIGINT NOT NULL,
    "maker_id" BIGINT NOT NULL,
    "nama_coworking" VARCHAR(100) NOT NULL,
    "nama_pemilik" VARCHAR(100) NOT NULL,
    "telp" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- RECONCILIATION LOG #2: harga_per_jam is INTEGER, not DOUBLE PRECISION.
CREATE TABLE "space" (
    "id" BIGSERIAL NOT NULL,
    "id_owner" BIGINT NOT NULL,
    "maker_id" BIGINT NOT NULL,
    "nama_space" VARCHAR(100) NOT NULL,
    "harga_per_jam" INTEGER NOT NULL,
    "tipe" "TipeSpace" NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "foto" VARCHAR(255),
    "deskripsi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- RECONCILIATION LOG #3: persentase_diskon kept as DECIMAL(5,2) — not
-- a monetary field, so the integer-money rule (§III.4) doesn't apply.
CREATE TABLE "diskon" (
    "id" BIGSERIAL NOT NULL,
    "maker_id" BIGINT NOT NULL,
    "nama_diskon" VARCHAR(100) NOT NULL,
    "persentase_diskon" DECIMAL(5,2) NOT NULL,
    "tanggal_awal" TIMESTAMP(3) NOT NULL,
    "tanggal_akhir" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diskon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- RECONCILIATION LOG #4 & #6: tanggal_reservasi is DATE (not
-- DATETIME); table is the flattened reservasi — no separate
-- detail_reservasi junction table exists in this schema.
CREATE TABLE "reservasi" (
    "id" BIGSERIAL NOT NULL,
    "maker_id" BIGINT NOT NULL,
    "kode_booking" VARCHAR(30) NOT NULL,
    "id_owner" BIGINT NOT NULL,
    "id_member" BIGINT NOT NULL,
    "id_space" BIGINT NOT NULL,
    "id_diskon" BIGINT,
    "tanggal_reservasi" DATE NOT NULL,
    "jam_mulai" TIME NOT NULL,
    "jam_selesai" TIME NOT NULL,
    "durasi_jam" INTEGER NOT NULL,
    "harga_per_jam" INTEGER NOT NULL,
    "total_harga_awal" INTEGER NOT NULL,
    "potongan_diskon" INTEGER NOT NULL DEFAULT 0,
    "total_bayar" INTEGER NOT NULL,
    "status" "StatusReservasi" NOT NULL DEFAULT 'belum_dikonfirm',
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "makers_username_key" ON "makers"("username");

-- CreateIndex
CREATE UNIQUE INDEX "makers_email_key" ON "makers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "makers_app_key_key" ON "makers"("app_key");

-- CreateIndex
-- Username uniqueness is per-tenant (composite), not global.
CREATE UNIQUE INDEX "users_maker_id_username_key" ON "users"("maker_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "member_id_user_key" ON "member"("id_user");

-- CreateIndex
-- GET /api/admin/members?search
CREATE INDEX "member_maker_id_nama_member_idx" ON "member"("maker_id", "nama_member");

-- CreateIndex
CREATE UNIQUE INDEX "space_owner_id_user_key" ON "space_owner"("id_user");

-- CreateIndex
-- GET /api/spaces?tipe
CREATE INDEX "space_maker_id_tipe_idx" ON "space"("maker_id", "tipe");

-- CreateIndex
-- GET /api/spaces?search
CREATE INDEX "space_nama_space_idx" ON "space"("nama_space");

-- CreateIndex
CREATE UNIQUE INDEX "diskon_maker_id_nama_diskon_key" ON "diskon"("maker_id", "nama_diskon");

-- CreateIndex
CREATE UNIQUE INDEX "reservasi_kode_booking_key" ON "reservasi"("kode_booking");

-- CreateIndex
-- Availability / overlap check (range comparison — enforced at
-- application layer, this index only speeds up the lookup).
CREATE INDEX "reservasi_id_space_tanggal_reservasi_jam_mulai_idx" ON "reservasi"("id_space", "tanggal_reservasi", "jam_mulai");

-- CreateIndex
-- Admin filter: ?status
CREATE INDEX "reservasi_maker_id_status_idx" ON "reservasi"("maker_id", "status");

-- CreateIndex
-- Monthly reports: ?month&?year
CREATE INDEX "reservasi_maker_id_tanggal_reservasi_idx" ON "reservasi"("maker_id", "tanggal_reservasi");

-- AddForeignKey (tenant cleanup: ON DELETE CASCADE)
ALTER TABLE "users" ADD CONSTRAINT "users_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "makers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (profile is meaningless without its user account)
ALTER TABLE "member" ADD CONSTRAINT "member_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (tenant cleanup: ON DELETE CASCADE)
ALTER TABLE "member" ADD CONSTRAINT "member_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "makers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (profile is meaningless without its user account)
ALTER TABLE "space_owner" ADD CONSTRAINT "space_owner_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (tenant cleanup: ON DELETE CASCADE)
ALTER TABLE "space_owner" ADD CONSTRAINT "space_owner_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "makers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (owner deletion cleans up their own spaces; reservasi
-- keeps history safe via its own RESTRICT-protected id_owner/id_space below)
ALTER TABLE "space" ADD CONSTRAINT "space_id_owner_fkey" FOREIGN KEY ("id_owner") REFERENCES "space_owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (tenant cleanup: ON DELETE CASCADE)
ALTER TABLE "space" ADD CONSTRAINT "space_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "makers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (tenant cleanup: ON DELETE CASCADE)
ALTER TABLE "diskon" ADD CONSTRAINT "diskon_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "makers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (tenant cleanup: ON DELETE CASCADE)
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "makers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (preserve booking history/reports — reject owner
-- deletion while reservations reference it)
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_owner_fkey" FOREIGN KEY ("id_owner") REFERENCES "space_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (preserve booking history/reports)
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_member_fkey" FOREIGN KEY ("id_member") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (preserve booking history/reports)
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_space_fkey" FOREIGN KEY ("id_space") REFERENCES "space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (promo removable post-use; total_bayar is already
-- snapshotted so historical accuracy is unaffected)
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_diskon_fkey" FOREIGN KEY ("id_diskon") REFERENCES "diskon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
