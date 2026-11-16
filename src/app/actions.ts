"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma, ROLES } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/guard";

export type ActionState =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined }
  | undefined;

function err(message: string): ActionState {
  return { error: message };
}

function ok(message: string): ActionState {
  return { success: message };
}

async function currentUser() {
  const u = await getSession();
  if (!u) redirect("/login");
  return u;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/**
 * Menjalankan operasi delete dan mengubah PrismaKnownRequestError (mis. P2003
 * foreign key) menjadi pesan yang bisa dibaca user, bukan 500 yang bobrok.
 */
async function safeDelete(
  op: () => Promise<unknown>,
  pesanGagal: (e: Prisma.PrismaClientKnownRequestError) => string,
): Promise<ActionState | null> {
  try {
    await op();
    return null;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return err(pesanGagal(e));
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return err("Data sudah tidak ada. Muat ulang halaman.");
    }
    throw e;
  }
}

/** Nama relasi yang disebut Prisma di error P2003, supaya pesan error jelas. */
function relasiName(meta: { field_name?: string } | undefined): string {
  const raw = meta?.field_name ?? "";
  if (!raw) return "data lain";
  return raw
    .replace(/_/g, " ")
    .replace(/Id$/, "")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Validasi bahwa kelas ada dan mapel terdaftar pada kelas tersebut.
 * Dipakai bersama oleh createTugas & createJadwal.
 */
async function validateKelasMapel(kelasId: string, mapelId: string): Promise<ActionState> {
  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: { mapel: { select: { id: true } } },
  });
  if (!kelas) return err("Kelas tidak ditemukan.");
  if (!kelas.mapel.some((m) => m.id === mapelId)) {
    return err("Mata pelajaran tersebut tidak terdaftar pada kelas ini.");
  }
  return ok("valid");
}

/* ---------------- TUGAS ---------------- */
async function createTugas(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["GURU", "ADMIN"]);

  const judul = str(fd, "judul");
  const deskripsi = str(fd, "deskripsi");
  const kelasId = str(fd, "kelasId");
  const mapelId = str(fd, "mapelId");
  const deadline = str(fd, "deadline");
  const lampiran = str(fd, "lampiran");

  if (!judul || !deskripsi || !kelasId || !mapelId || !deadline) {
    return err("Semua field wajib diisi.");
  }
  if (Number.isNaN(new Date(deadline).getTime())) return err("Deadline tidak valid.");

  const kelasMapel = await validateKelasMapel(kelasId, mapelId);
  if (kelasMapel?.error) return kelasMapel;

  const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
  if (u.role === "GURU" && kelas?.guruId !== u.id) {
    return err("Anda hanya dapat membuat tugas untuk kelas yang Anda ampu.");
  }

  await prisma.tugas.create({
    data: {
      judul,
      deskripsi,
      kelasId,
      mapelId,
      guruId: u.id,
      deadline: new Date(deadline),
      lampiran: lampiran || null,
    },
  });

  revalidatePath("/tugas");
  revalidatePath("/dashboard");
  return ok(`Tugas "${judul}" berhasil dibuat.`);
}

async function deleteTugas(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["GURU", "ADMIN"]);

  const id = str(fd, "id");
  const tugas = await prisma.tugas.findUnique({ where: { id } });
  if (!tugas) return err("Tugas tidak ditemukan.");
  if (u.role === "GURU" && tugas.guruId !== u.id) {
    return err("Anda tidak berhak menghapus tugas ini.");
  }

  const gag = await safeDelete(
    () => prisma.tugas.delete({ where: { id } }),
    (e) => `Tidak bisa menghapus tugas: masih ada ${relasiName(e.meta)} yang terhubung.`
  );
  if (gag) return gag;
  revalidatePath("/tugas");
  revalidatePath("/dashboard");
  return ok("Tugas berhasil dihapus.");
}

async function submitTugas(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["SISWA"]);

  const tugasId = str(fd, "tugasId");
  const file = str(fd, "file");
  const catatan = str(fd, "catatan");

  if (!tugasId) return err("Tugas tidak valid.");

  const tugas = await prisma.tugas.findUnique({ where: { id: tugasId } });
  if (!tugas) return err("Tugas tidak ditemukan.");

  const anggota = await prisma.kelas.findFirst({
    where: { id: tugas.kelasId, siswa: { some: { id: u.id } } },
  });
  if (!anggota) return err("Anda bukan anggota kelas ini.");

  const existing = await prisma.pengumpulan.findFirst({ where: { tugasId, siswaId: u.id } });
  if (existing) {
    await prisma.pengumpulan.update({
      where: { id: existing.id },
      data: { file, catatan, submitPada: new Date() },
    });
  } else {
    await prisma.pengumpulan.create({ data: { tugasId, siswaId: u.id, file, catatan } });
  }

  revalidatePath("/tugas");
  revalidatePath("/dashboard");
  return ok("Tugas berhasil dikumpulkan.");
}

/* ---------------- NILAI ---------------- */
async function createNilai(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["GURU", "ADMIN"]);

  const siswaId = str(fd, "siswaId");
  const tipe = str(fd, "tipe") || "HARIAN";
  const semester = Number(str(fd, "semester") || "1");
  const nilaiRaw = str(fd, "nilai");
  const nilai = Number(nilaiRaw);
  const catatan = str(fd, "catatan");
  const tugasId = str(fd, "tugasId");

  if (!siswaId) return err("Siswa wajib dipilih.");
  if (nilaiRaw === "" || Number.isNaN(nilai)) return err("Nilai harus berupa angka.");
  if (nilai < 0 || nilai > 100) return err("Nilai harus antara 0 sampai 100.");
  if (tipe === "TUGAS" && !tugasId) return err("Pilih tugas untuk nilai bertipe TUGAS.");

  const siswa = await prisma.user.findFirst({ where: { id: siswaId, role: "SISWA" } });
  if (!siswa) return err("Siswa tidak ditemukan.");

  // Guru hanya boleh menilai siswa di kelas yang ia ampu. Tanpa cek ini, Guru A
  // bisa menginput nilai siswa milik Guru B hanya dengan mengirim ID berbeda.
  if (u.role === "GURU") {
    const boleh = await prisma.kelas.count({
      where: { guruId: u.id, siswa: { some: { id: siswaId } } },
    });
    if (boleh === 0) return err("Anda hanya dapat menilai siswa kelas yang Anda ampu.");
  }

  if (tugasId) {
    const t = await prisma.tugas.findUnique({ where: { id: tugasId } });
    if (!t) return err("Tugas tidak ditemukan.");
    const anggota = await prisma.kelas.findFirst({
      where: { id: t.kelasId, siswa: { some: { id: siswaId } } },
    });
    if (!anggota) return err("Siswa tersebut bukan anggota kelas tugas ini.");
    if (u.role === "GURU" && t.guruId !== u.id) {
      return err("Anda hanya dapat memakai nilai dari tugas milik Anda.");
    }
  }

  await prisma.nilai.create({
    data: {
      siswaId,
      tipe,
      semester: Number.isFinite(semester) && semester > 0 ? Math.floor(semester) : 1,
      nilai,
      catatan: catatan || null,
      tugasId: tugasId || null,
      guruId: u.id,
    },
  });

  revalidatePath("/nilai");
  revalidatePath("/dashboard");
  return ok(`Nilai ${nilai} untuk ${siswa.name} tersimpan.`);
}

async function deleteNilai(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["GURU", "ADMIN"]);

  const id = str(fd, "id");
  const n = await prisma.nilai.findUnique({ where: { id } });
  if (!n) return err("Nilai tidak ditemukan.");

  // Guru hanya boleh menghapus nilai yang ia input sendiri.
  if (u.role === "GURU" && n.guruId !== u.id) {
    return err("Anda hanya dapat menghapus nilai yang Anda input.");
  }

  const gag = await safeDelete(
    () => prisma.nilai.delete({ where: { id } }),
    () => "Tidak bisa menghapus nilai ini."
  );
  if (gag) return gag;
  revalidatePath("/nilai");
  revalidatePath("/dashboard");
  return ok("Nilai berhasil dihapus.");
}

/* ---------------- PROFIL SAYA ---------------- */
/**
 * Mengubah password sendiri.
 *
 * Wajib mencocokkan password lama supaya session yang dibajak tidak bisa
 * mengunci pemilik akun. Setelah diganti, sesi lama di token JWT masih berlaku
 * sampai kedaluwarsa, jadi pengguna diminta login ulang.
 */
async function updatePassword(fd: FormData): Promise<ActionState> {
  const u = await currentUser();

  const lama = String(fd.get("passwordLama") ?? "");
  const baru = String(fd.get("passwordBaru") ?? "");
  const ulangi = String(fd.get("passwordUlangi") ?? "");

  if (!lama) return err("Password lama wajib diisi.");
  if (baru.length < 6) return err("Password baru minimal 6 karakter.");
  if (baru !== ulangi) return err("Konfirmasi password tidak cocok.");
  if (baru === lama) return err("Password baru harus berbeda dari password lama.");

  const { compare } = await import("bcryptjs");
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return err("Akun tidak ditemukan.");

  if (!(await compare(lama, user.password))) {
    return err("Password lama salah.");
  }

  await prisma.user.update({
    where: { id: u.id },
    data: { password: await bcrypt.hash(baru, 10) },
  });

  revalidatePath("/profil");
  return ok("Password berhasil diubah.");
}

/* ---------------- UBAH NILAI ---------------- */
/**
 * Mengoreksi nilai yang salah input.
 *
 * Sebelumnya admin harus hapus lalu buat ulang, dan karena Nilai tidak punya
 * unique constraint, delete-lalu-create berisiko menyisakan catatan lama
 * bila salah langkah. Update adalah operasi yang lebih aman.
 */
async function updateNilai(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["GURU", "ADMIN"]);

  const id = str(fd, "id");
  const nilaiRaw = str(fd, "nilai");
  const catatan = str(fd, "catatan");

  const nilai = Number(nilaiRaw);
  if (!id) return err("Nilai tidak valid.");
  if (nilaiRaw === "" || Number.isNaN(nilai)) return err("Nilai harus berupa angka.");
  if (nilai < 0 || nilai > 100) return err("Nilai harus antara 0 sampai 100.");

  const lama = await prisma.nilai.findUnique({ where: { id } });
  if (!lama) return err("Nilai tidak ditemukan.");
  if (u.role === "GURU" && lama.guruId !== u.id) {
    return err("Anda hanya dapat mengubah nilai yang Anda input.");
  }

  const upd = await prisma.nilai.update({
    where: { id },
    data: { nilai, catatan: catatan || null },
  });

  revalidatePath("/nilai");
  revalidatePath("/dashboard");
  return ok(`Nilai diperbarui menjadi ${upd.nilai}.`);
}

/* ---------------- NILAI PENGUMPULAN ---------------- */
/**
 * Guru memberi nilai akhir pada satu pengumpulan tugas siswa.
 * Otomatis membuat / memperbarui record Nilai bertipe TUGAS supaya rapor
 * selalu sinkron dengan penilaian di halaman nilai.
 */
async function gradePengumpulan(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["GURU", "ADMIN"]);

  const id = str(fd, "id");
  const nilaiRaw = str(fd, "nilaiAkhir");
  const catatan = str(fd, "catatan");

  const nilai = nilaiRaw === "" ? null : Number(nilaiRaw);
  if (nilai !== null && Number.isNaN(nilai)) return err("Nilai harus berupa angka.");
  if (nilai !== null && (nilai < 0 || nilai > 100)) {
    return err("Nilai harus antara 0 sampai 100.");
  }

  const p = await prisma.pengumpulan.findUnique({
    where: { id },
    include: { tugas: { select: { id: true, judul: true, mapelId: true } } },
  });
  if (!p) return err("Pengumpulan tidak ditemukan.");
  if (u.role === "GURU") {
    const tugas = await prisma.tugas.findUnique({
      where: { id: p.tugasId },
      select: { guruId: true },
    });
    if (tugas?.guruId !== u.id) return err("Anda hanya dapat menilai tugas milik Anda.");
  }

  await prisma.pengumpulan.update({
    where: { id },
    data: { nilaiAkhir: nilai, catatan: catatan || p.catatan },
  });

  // Sinkronkan ke tabel Nilai (tipe TUGAS) agar rapor tidak dobel / stale.
  const existing = await prisma.nilai.findFirst({
    where: { tugasId: p.tugasId, siswaId: p.siswaId, tipe: "TUGAS" },
  });
  if (nilai === null) {
    if (existing) await prisma.nilai.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.nilai.update({ where: { id: existing.id }, data: { nilai } });
  } else {
    await prisma.nilai.create({
      data: {
        siswaId: p.siswaId,
        tugasId: p.tugasId,
        guruId: u.id,
        tipe: "TUGAS",
        semester: 1,
        nilai,
        catatan: catatan || null,
      },
    });
  }

  revalidatePath("/tugas");
  revalidatePath("/nilai");
  revalidatePath("/dashboard");
  return ok(
    nilai === null
      ? "Nilai pengumpulan dihapus."
      : `Nilai ${nilai} untuk ${p.tugas.judul} tersimpan.`
  );
}

/* ---------------- ABSENSI ---------------- */
const STATUS = ["HADIR", "IZIN", "SAKIT", "ALFA"];

async function setAbsensi(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const tanggal = str(fd, "tanggal");
  const status = str(fd, "status") || "HADIR";
  const catatan = str(fd, "catatan");
  const kelasId = str(fd, "kelasId");
  const ids = fd.getAll("siswaId").map(String).filter(Boolean);

  if (!tanggal) return err("Tanggal wajib diisi.");
  if (!STATUS.includes(status)) return err("Status absensi tidak valid.");
  if (!kelasId) return err("Kelas wajib diisi.");
  if (ids.length === 0) return err("Kelas ini belum memiliki siswa.");

  const day = new Date(tanggal);
  if (Number.isNaN(day.getTime())) return err("Tanggal tidak valid.");

  // ID siswa dikirim lewat form, jadi harus divalidasi terhadap anggota kelas
  // terpilih — kalau tidak, angka bisa diubah untuk menandai siswa di luar
  // kelas tersebut.
  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    select: { id: true, siswa: { select: { id: true } } },
  });
  if (!kelas) return err("Kelas tidak ditemukan.");

  const anggota = new Set(kelas.siswa.map((s) => s.id));
  const tidakAnggota = ids.filter((id) => !anggota.has(id));
  if (tidakAnggota.length > 0) {
    return err("Ada siswa yang bukan anggota kelas ini. Muat ulang halaman.");
  }

  await prisma.$transaction(
    ids.map((siswaId) =>
      prisma.absensi.upsert({
        where: { siswaId_tanggal: { siswaId, tanggal: day } },
        update: { status, catatan: catatan || null },
        create: { siswaId, tanggal: day, status, catatan: catatan || null },
      })
    )
  );

  revalidatePath("/absensi");
  revalidatePath("/dashboard");
  revalidatePath("/laporan");
  revalidatePath("/profil");
  return ok(`Absensi ${ids.length} siswa tersimpan.`);
}

/* ---------------- JADWAL ---------------- */
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

async function createJadwal(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "KURIKULUM", "KEPSEK"]);

  const hari = str(fd, "hari");
  const jamMulai = str(fd, "jamMulai");
  const jamSelesai = str(fd, "jamSelesai");
  const ruangan = str(fd, "ruangan");
  const kelasId = str(fd, "kelasId");
  const mapelId = str(fd, "mapelId");

  if (!hari || !jamMulai || !jamSelesai || !kelasId || !mapelId) {
    return err("Semua field wajib diisi.");
  }
  if (!HARI.includes(hari)) return err("Hari tidak valid.");
  if (jamSelesai <= jamMulai) return err("Jam selesai harus setelah jam mulai.");

  const kelasMapel = await validateKelasMapel(kelasId, mapelId);
  if (kelasMapel?.error) return kelasMapel;

  await prisma.jadwal.create({ data: { hari, jamMulai, jamSelesai, ruangan, kelasId, mapelId } });
  revalidatePath("/jadwal");
  return ok("Jadwal berhasil ditambahkan.");
}

async function deleteJadwal(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "KURIKULUM", "KEPSEK"]);

  const id = str(fd, "id");
  const j = await prisma.jadwal.findUnique({ where: { id } });
  if (!j) return err("Jadwal tidak ditemukan.");

  const gag = await safeDelete(
    () => prisma.jadwal.delete({ where: { id } }),
    () => "Tidak bisa menghapus jadwal ini."
  );
  if (gag) return gag;
  revalidatePath("/jadwal");
  return ok("Jadwal berhasil dihapus.");
}

/* ---------------- MAPEL ---------------- */
async function createMapel(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "KURIKULUM"]);

  const nama = str(fd, "nama");
  const kode = str(fd, "kode").toUpperCase();
  const deskripsi = str(fd, "deskripsi");
  const kelasIds = fd.getAll("kelasId").map(String).filter(Boolean);

  if (!nama || !kode) return err("Nama dan kode mapel wajib diisi.");

  const bentrok = await prisma.mapel.findUnique({ where: { kode } });
  if (bentrok) return err("Kode mapel sudah digunakan.");

  await prisma.mapel.create({
    data: { nama, kode, deskripsi, kelas: { connect: kelasIds.map((id) => ({ id })) } },
  });

  revalidatePath("/mapel");
  return ok(`Mata pelajaran "${nama}" ditambahkan.`);
}

async function deleteMapel(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "KURIKULUM"]);

  const id = str(fd, "id");
  const [tugas, jadwal] = await Promise.all([
    prisma.tugas.count({ where: { mapelId: id } }),
    prisma.jadwal.count({ where: { mapelId: id } }),
  ]);
  if (tugas > 0 || jadwal > 0) {
    return err(
      `Mapel masih digunakan pada ${tugas} tugas dan ${jadwal} jadwal. Hapus dulu sebelum mapel dihapus.`
    );
  }

  const gag = await safeDelete(
    () => prisma.mapel.delete({ where: { id } }),
    () => "Tidak bisa menghapus mapel ini."
  );
  if (gag) return gag;
  revalidatePath("/mapel");
  return ok("Mata pelajaran berhasil dihapus.");
}

/* ---------------- KELAS ---------------- */
async function createKelas(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN"]);

  const nama = str(fd, "nama");
  const tingkat = str(fd, "tingkat");
  const tahun = str(fd, "tahun");
  const wali = str(fd, "wali");
  const guruId = str(fd, "guruId");
  const siswaIds = fd.getAll("siswaId").map(String).filter(Boolean);

  if (!nama || !tingkat || !tahun) return err("Nama, tingkat, dan tahun wajib diisi.");

  if (guruId) {
    const g = await prisma.user.findFirst({ where: { id: guruId, role: "GURU" } });
    if (!g) return err("Guru pengampu tidak ditemukan.");
  }

  await prisma.kelas.create({
    data: {
      nama,
      tingkat,
      tahun,
      wali,
      guruId: guruId || null,
      siswa: { connect: siswaIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/kelas");
  revalidatePath("/dashboard");
  return ok(`Kelas "${nama}" berhasil dibuat.`);
}

async function deleteKelas(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN"]);

  const id = str(fd, "id");
  const k = await prisma.kelas.findUnique({ where: { id } });
  if (!k) return err("Kelas tidak ditemukan.");

  const gag = await safeDelete(
    () => prisma.kelas.delete({ where: { id } }),
    () => "Tidak bisa menghapus kelas ini."
  );
  if (gag) return gag;
  revalidatePath("/kelas");
  revalidatePath("/dashboard");
  return ok(`Kelas "${k.nama}" berhasil dihapus.`);
}

/* ---------------- PENGGUNA ---------------- */
async function createUser(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN"]);

  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const nis = str(fd, "nis");
  const nip = str(fd, "nip");
  const phone = str(fd, "phone");
  const gender = str(fd, "gender");

  if (name.length < 2) return err("Nama minimal 2 karakter.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return err("Email tidak valid.");
  if (password.length < 6) return err("Password minimal 6 karakter.");
  if (!ROLES.includes(role as (typeof ROLES)[number])) return err("Role tidak valid.");
  if (gender && !["L", "P"].includes(gender)) return err("Jenis kelamin tidak valid.");
  if (role === "SISWA" && !nis) return err("NIS wajib diisi untuk akun siswa.");
  if (role !== "SISWA" && !nip) return err("NIP wajib diisi untuk akun non-siswa.");

  const ada = await prisma.user.findUnique({ where: { email } });
  if (ada) return err("Email sudah terdaftar.");

  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      nis: nis || null,
      nip: nip || null,
      phone: phone || null,
      gender: gender || null,
    },
  });

  revalidatePath("/pengguna");
  return ok(`Akun ${email} berhasil dibuat.`);
}

async function toggleUser(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN"]);

  const id = str(fd, "id");
  if (!id) return err("Pengguna tidak valid.");
  if (id === u.id) return err("Tidak bisa menonaktifkan akun sendiri.");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return err("Pengguna tidak ditemukan.");

  await prisma.user.update({ where: { id }, data: { active: !target.active } });
  revalidatePath("/pengguna");
  return ok(`Akun ${target.name} berhasil ${target.active ? "dinonaktifkan" : "diaktifkan"}.`);
}

async function deleteUser(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN"]);

  const id = str(fd, "id");
  if (!id) return err("Pengguna tidak valid.");
  if (id === u.id) return err("Tidak bisa menghapus akun sendiri.");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return err("Pengguna tidak ditemukan.");

  const gag = await safeDelete(
    () => prisma.user.delete({ where: { id } }),
    (e) =>
      `Akun ${target.name} masih digunakan oleh ${relasiName(e.meta)}. ` +
      `Nonaktifkan akunnya, atau hapus dulu data terkait.`
  );
  if (gag) return gag;
  revalidatePath("/pengguna");
  return ok(`Akun ${target.name} berhasil dihapus.`);
}

/* ---------------- PENGUMUMAN ---------------- */
const TARGETS = ["SEMUA", ...ROLES];

async function createPengumuman(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "GURU", "KEPSEK", "KURIKULUM"]);

  const judul = str(fd, "judul");
  const isi = str(fd, "isi");
  const target = str(fd, "target") || "SEMUA";

  if (!judul || !isi) return err("Judul dan isi pengumuman wajib diisi.");
  if (!TARGETS.includes(target)) return err("Target pengumuman tidak valid.");

  await prisma.pengumuman.create({ data: { judul, isi, target, authorId: u.id } });
  revalidatePath("/pengumuman");
  revalidatePath("/dashboard");
  return ok("Pengumuman berhasil dikirim.");
}

async function deletePengumuman(fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  requireRole(u.role, ["ADMIN", "KEPSEK"]);

  const id = str(fd, "id");
  const p = await prisma.pengumuman.findUnique({ where: { id } });
  if (!p) return err("Pengumuman tidak ditemukan.");
  if (p.authorId !== u.id && u.role !== "ADMIN") {
    return err("Hanya pembuat atau admin yang dapat menghapus.");
  }

  const gag = await safeDelete(
    () => prisma.pengumuman.delete({ where: { id } }),
    () => "Tidak bisa menghapus pengumuman ini."
  );
  if (gag) return gag;
  revalidatePath("/pengumuman");
  revalidatePath("/dashboard");
  return ok("Pengumuman berhasil dihapus.");
}

export {
  createTugas,
  deleteTugas,
  submitTugas,
  createNilai,
  deleteNilai,
  updateNilai,
  gradePengumpulan,
  setAbsensi,
  createJadwal,
  deleteJadwal,
  createMapel,
  deleteMapel,
  createKelas,
  deleteKelas,
  createUser,
  toggleUser,
  deleteUser,
  createPengumuman,
  deletePengumuman,
  updatePassword,
};
