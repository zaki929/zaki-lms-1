import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  // ===== Users =====
  await prisma.pengumuman.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.nilai.deleteMany();
  await prisma.pengumpulan.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.jadwal.deleteMany();
  await prisma.mapel.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Messi",
      email: "admin@sekolah.test",
      password: await hash("admin123"),
      role: "ADMIN",
    },
  });

  const kepsek = await prisma.user.create({
    data: {
      name: "Drs. Budi Santoso, M.Pd",
      email: "kepsek@sekolah.test",
      password: await hash("kepsek123"),
      role: "KEPSEK",
      nip: "196505121994031005",
    },
  });

  const kurikulum = await prisma.user.create({
    data: {
      name: "Jamillah",
      email: "kurikulum@sekolah.test",
      password: await hash("kurikulum123"),
      role: "KURIKULUM",
      nip: "197203151998022003",
    },
  });

  const guru = await prisma.user.create({
    data: {
      name: "Pedro",
      email: "guru@sekolah.test",
      password: await hash("guru123"),
      role: "GURU",
      nip: "198507102010011004",
    },
  });

  const guru2 = await prisma.user.create({
    data: {
      name: "Amir",
      email: "guru2@sekolah.test",
      password: await hash("guru123"),
      role: "GURU",
      nip: "198801152012012005",
    },
  });

  const siswa1 = await prisma.user.create({
    data: {
      name: "Zahra",
      email: "siswa@sekolah.test",
      password: await hash("siswa123"),
      role: "SISWA",
      nis: "2210112345",
    },
  });

  const siswa2 = await prisma.user.create({
    data: {
      name: "Putri Amelia",
      email: "siswa2@sekolah.test",
      password: await hash("siswa123"),
      role: "SISWA",
      nis: "2210112346",
    },
  });

  const siswa3 = await prisma.user.create({
    data: {
      name: "Rangga",
      email: "siswa3@sekolah.test",
      password: await hash("siswa123"),
      role: "SISWA",
      nis: "2210112347",
    },
  });

  // ===== Kelas =====
  const kelasX = await prisma.kelas.create({
    data: {
      nama: "XII PPLG 1",
      tingkat: "XII",
      tahun: "2025/2026",
      wali: "Pedro",
      guruId: guru.id,
      siswa: { connect: [{ id: siswa1.id }, { id: siswa2.id }] },
    },
  });

  const kelasXI = await prisma.kelas.create({
    data: {
      nama: "XII PPLG 2",
      tingkat: "XII",
      tahun: "2025/2026",
      wali: "Amir",
      guruId: guru2.id,
      siswa: { connect: [{ id: siswa3.id }] },
    },
  });

  // ===== Mapel =====
  const mtk = await prisma.mapel.create({
    data: {
      nama: "Matematika Wajib",
      kode: "MTK",
      deskripsi: "Mempelajari perhitungan, aljabar, dan geometri.",
      kelas: { connect: [{ id: kelasX.id }, { id: kelasXI.id }] },
    },
  });
  const bing = await prisma.mapel.create({
    data: {
      nama: "Bahasa Inggris",
      kode: "BIG",
      deskripsi: "Mempelajari kemampuan berbahasa Inggris: grammar, vocabulary, dan writing.",
      kelas: { connect: [{ id: kelasX.id }] },
    },
  });
  const pjk = await prisma.mapel.create({
    data: {
      nama: "PJOK",
      kode: "PJOK",
      deskripsi: "Pendidikan Pancasila dan Kewarganegaraan.",
      kelas: { connect: [{ id: kelasX.id }] },
    },
  });
  const bindo = await prisma.mapel.create({
    data: {
      nama: "Basis Data",
      kode: "BDD",
      deskripsi: "Mempelajari perancangan, pembuatan, dan pengelolaan basis data menggunakan SQL.",
      kelas: { connect: [{ id: kelasXI.id }] },
    },
  });
  const jepang = await prisma.mapel.create({
    data: {
      nama: "Bahasa Jepang",
      kode: "JPN",
      deskripsi: "Mempelajari dasar bahasa Jepang: hiragana, katakana, dan kanji.",
      kelas: { connect: [{ id: kelasX.id }, { id: kelasXI.id }] },
    },
  });

  // ===== Jadwal =====
  const hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  for (let i = 0; i < hari.length; i++) {
    await prisma.jadwal.create({
      data: {
        hari: hari[i],
        jamMulai: "07:15",
        jamSelesai: "08:45",
        ruangan: `R.${100 + i}`,
        kelasId: kelasX.id,
        mapelId: [mtk, bing, pjk][i % 3].id,
      },
    });
  }
  await prisma.jadwal.create({
    data: {
      hari: "Senin",
      jamMulai: "09:00",
      jamSelesai: "10:30",
      ruangan: "Lab IPA",
      kelasId: kelasXI.id,
      mapelId: bindo.id,
    },
  });

  // ===== Tugas =====
  const now = new Date();
  const t1 = await prisma.tugas.create({
    data: {
      judul: "Latihan Aljabar Linear",
      deskripsi: "Kerjakan soal 1-20 pada buku paket halaman 88.",
      deadline: new Date(now.getTime() + 3 * 86400000),
      mapelId: mtk.id,
      kelasId: kelasX.id,
      guruId: guru.id,
    },
  });
  const t2 = await prisma.tugas.create({
    data: {
      judul: "Practice Writing: Descriptive Text",
      deskripsi: "Tulis 2 paragraf descriptive text (5-7 kalimat) tentang salah satu tempat favoritmu dalam Bahasa Inggris.",
      deadline: new Date(now.getTime() + 5 * 86400000),
      mapelId: bing.id,
      kelasId: kelasX.id,
      guruId: guru.id,
    },
  });
  await prisma.tugas.create({
    data: {
      judul: "Esai Proklamasi Kemerdekaan",
      deskripsi: "Tulis esai 500 kata tentang makna kemerdekaan bagi generasi muda.",
      deadline: new Date(now.getTime() + 7 * 86400000),
      mapelId: pjk.id,
      kelasId: kelasX.id,
      guruId: guru.id,
    },
  });

  // Tugas tambahan khusus kelas XII PPLG 2 (Basis Data & Bahasa Jepang)
  await prisma.tugas.create({
    data: {
      judul: "Praktikum SQL: CRUD pada Tabel Siswa",
      deskripsi: "Buat tabel siswa lalu latihan CREATE, INSERT, SELECT, UPDATE, dan DELETE. Kumpulkan skrip SQL-nya.",
      deadline: new Date(now.getTime() + 4 * 86400000),
      mapelId: bindo.id,
      kelasId: kelasXI.id,
      guruId: guru2.id,
    },
  });
  await prisma.tugas.create({
    data: {
      judul: "Hiragana & Katakana Latihan 1",
      deskripsi: "Tulis 20 huruf hiragana dan 20 katakana beserta contoh kata.",
      deadline: new Date(now.getTime() + 6 * 86400000),
      mapelId: jepang.id,
      kelasId: kelasXI.id,
      guruId: guru2.id,
    },
  });

  // ===== Pengumpulan =====
  await prisma.pengumpulan.create({
    data: {
      tugasId: t1.id,
      siswaId: siswa1.id,
      file: "tugas-01.pdf",
      catatan: "Sudah dikerjakan.",
    },
  });
  await prisma.pengumpulan.create({
    data: {
      tugasId: t2.id,
      siswaId: siswa2.id,
      file: "descriptive-text.pdf",
    },
  });

  // ===== Nilai =====
  await prisma.nilai.create({
    data: { tipe: "TUGAS", semester: 1, nilai: 88, siswaId: siswa1.id, tugasId: t1.id, guruId: guru.id },
  });
  await prisma.nilai.create({
    data: { tipe: "UTS", semester: 1, nilai: 82, siswaId: siswa1.id, guruId: guru.id },
  });
  await prisma.nilai.create({
    data: { tipe: "HARIAN", semester: 1, nilai: 90, siswaId: siswa1.id, guruId: guru.id },
  });
  await prisma.nilai.create({
    data: { tipe: "TUGAS", semester: 1, nilai: 79, siswaId: siswa2.id, tugasId: t2.id, guruId: guru.id },
  });
  await prisma.nilai.create({
    data: { tipe: "UTS", semester: 1, nilai: 85, siswaId: siswa2.id, guruId: guru.id },
  });

  // ===== Absensi =====
  for (let i = 0; i < 10; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    await prisma.absensi.create({
      data: { tanggal: d, status: i % 7 === 0 ? "SAKIT" : "HADIR", siswaId: siswa1.id },
    });
    await prisma.absensi.create({
      data: { tanggal: d, status: i % 5 === 0 ? "IZIN" : "HADIR", siswaId: siswa2.id },
    });
  }

  // ===== Pengumuman =====
  await prisma.pengumuman.createMany({
    data: [
      {
        judul: "Pemberitahuan Ujian Tengah Semester",
        isi: "Ujian tengah semester akan dilaksanakan tanggal 1-5 Oktober. Persiapkan diri dengan baik.",
        target: "SEMUA",
        authorId: admin.id,
      },
      {
        judul: "Rapat Guru",
        isi: "Rapat guru rutin dilaksanakan setiap hari Jumat pukul 15:00 di ruang guru.",
        target: "GURU",
        authorId: kepsek.id,
      },
      {
        judul: "Kurikulum Merdeka Semester 1",
        isi: "Modul ajar kurikulum merdeka untuk semester ini sudah dapat diakses di portal kurikulum.",
        target: "SEMUA",
        authorId: kurikulum.id,
      },
    ],
  });

  console.log("Seed selesai. Akun demo:");
  console.log("  admin@sekolah.test / admin123");
  console.log("  kepsek@sekolah.test / kepsek123");
  console.log("  kurikulum@sekolah.test / kurikulum123");
  console.log("  guru@sekolah.test / guru123");
  console.log("  siswa@sekolah.test / siswa123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
