import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { prisma, ROLE_LABEL } from "@/lib/prisma";
import { Badge, Card, DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui";

function fmtWaktu(d: Date) {
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function AdminDashboard({ user }: { user: SessionUser }) {
  const [
    totalUser,
    totalSiswa,
    totalGuru,
    totalKelas,
    totalMapel,
    kelasList,
    siswaList,
    guruList,
    mapelList,
    aktivitasTerbaru,
    tahunAktif,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SISWA" } }),
    prisma.user.count({ where: { role: "GURU" } }),
    prisma.kelas.count(),
    prisma.mapel.count(),
    prisma.kelas.findMany({
      select: {
        id: true,
        nama: true,
        tingkat: true,
        tahun: true,
        _count: { select: { siswa: true } },
        guru: { select: { name: true } },
      },
      orderBy: { nama: "asc" },
      take: 8,
    }),
    prisma.user.findMany({
      where: { role: "SISWA" },
      select: { id: true, name: true, email: true, nis: true, active: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.user.findMany({
      where: { role: "GURU" },
      select: { id: true, name: true, email: true, nip: true, active: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.mapel.findMany({
      select: { id: true, nama: true, kode: true, _count: { select: { kelas: true } } },
      orderBy: { nama: "asc" },
      take: 8,
    }),
    prisma.absensi.findMany({
      select: { id: true, siswaId: true, status: true, tanggal: true, siswa: { select: { name: true } } },
      orderBy: { tanggal: "desc" },
      take: 8,
    }),
    prisma.tahunAjaran.findFirst({ where: { aktif: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user.name.split(",")[0]}`}
        desc={
          tahunAktif
            ? `Manajemen sekolah — TA ${tahunAktif.nama} (Semester ${tahunAktif.semester}) — Anda login sebagai ${ROLE_LABEL[user.role]}.`
            : `Manajemen sekolah — Anda login sebagai ${ROLE_LABEL[user.role]}.`
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Pengguna" value={totalUser} accent="bg-blue-500" hint="semua role" />
        <StatCard label="Total Siswa" value={totalSiswa} accent="bg-emerald-500" />
        <StatCard label="Total Guru" value={totalGuru} accent="bg-sky-500" />
        <StatCard label="Total Kelas" value={totalKelas} accent="bg-amber-500" />
        <StatCard label="Total Mata Pelajaran" value={totalMapel} accent="bg-slate-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Data Kelas */}
        <Card
          title="Data Kelas"
          action={
            <Link href="/kelas" className="text-xs font-semibold text-blue-600 hover:underline">
              Kelola &rarr;
            </Link>
          }
        >
          {kelasList.length === 0 ? (
            <EmptyState message="Belum ada kelas." />
          ) : (
            <DataTable
              minWidth={520}
              caption="Data kelas"
              head={
                <>
                  <th scope="col" className="w-[30%]">Kelas</th>
                  <th scope="col" className="w-[20%]">Tingkat</th>
                  <th scope="col" className="w-[20%]">Tahun</th>
                  <th scope="col" className="w-[15%] text-right">Siswa</th>
                  <th scope="col" className="w-[15%]">Wali</th>
                </>
              }
            >
              {kelasList.map((k) => (
                <tr key={k.id} className="transition hover:bg-slate-50">
                  <td className="font-medium text-slate-800">{k.nama}</td>
                  <td className="text-slate-600">{k.tingkat}</td>
                  <td className="text-slate-600">{k.tahun}</td>
                  <td className="text-right tabular-nums text-slate-600">{k._count.siswa}</td>
                  <td className="truncate text-slate-600">{k.guru?.name ?? "-"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        {/* Data Siswa */}
        <Card
          title="Data Siswa"
          action={
            <Link href="/pengguna" className="text-xs font-semibold text-blue-600 hover:underline">
              Kelola &rarr;
            </Link>
          }
        >
          {siswaList.length === 0 ? (
            <EmptyState message="Belum ada siswa." />
          ) : (
            <DataTable
              minWidth={520}
              caption="Data siswa"
              head={
                <>
                  <th scope="col" className="w-[30%]">Nama</th>
                  <th scope="col" className="w-[20%]">NIS</th>
                  <th scope="col" className="w-[35%]">Email</th>
                  <th scope="col" className="w-[15%]">Status</th>
                </>
              }
            >
              {siswaList.map((s) => (
                <tr key={s.id} className="transition hover:bg-slate-50">
                  <td className="font-medium text-slate-800">{s.name}</td>
                  <td className="tabular-nums text-slate-600">{s.nis ?? "-"}</td>
                  <td className="truncate text-slate-600">{s.email}</td>
                  <td>
                    <Badge tone={s.active ? "green" : "slate"}>{s.active ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        {/* Data Guru */}
        <Card
          title="Data Guru"
          action={
            <Link href="/pengguna" className="text-xs font-semibold text-blue-600 hover:underline">
              Kelola &rarr;
            </Link>
          }
        >
          {guruList.length === 0 ? (
            <EmptyState message="Belum ada guru." />
          ) : (
            <DataTable
              minWidth={520}
              caption="Data guru"
              head={
                <>
                  <th scope="col" className="w-[30%]">Nama</th>
                  <th scope="col" className="w-[20%]">NIP</th>
                  <th scope="col" className="w-[35%]">Email</th>
                  <th scope="col" className="w-[15%]">Status</th>
                </>
              }
            >
              {guruList.map((g) => (
                <tr key={g.id} className="transition hover:bg-slate-50">
                  <td className="font-medium text-slate-800">{g.name}</td>
                  <td className="tabular-nums text-slate-600">{g.nip ?? "-"}</td>
                  <td className="truncate text-slate-600">{g.email}</td>
                  <td>
                    <Badge tone={g.active ? "green" : "slate"}>{g.active ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        {/* Data Mapel */}
        <Card
          title="Data Mata Pelajaran"
          action={
            <Link href="/mapel" className="text-xs font-semibold text-blue-600 hover:underline">
              Kelola &rarr;
            </Link>
          }
        >
          {mapelList.length === 0 ? (
            <EmptyState message="Belum ada mata pelajaran." />
          ) : (
            <DataTable
              minWidth={520}
              caption="Data mata pelajaran"
              head={
                <>
                  <th scope="col" className="w-[35%]">Mata Pelajaran</th>
                  <th scope="col" className="w-[15%]">Kode</th>
                  <th scope="col" className="w-[20%] text-right">Kelas</th>
                  <th scope="col" className="w-[30%]">Aksi</th>
                </>
              }
            >
              {mapelList.map((m) => (
                <tr key={m.id} className="transition hover:bg-slate-50">
                  <td className="font-medium text-slate-800">{m.nama}</td>
                  <td className="text-slate-600">{m.kode}</td>
                  <td className="text-right tabular-nums text-slate-600">{m._count.kelas}</td>
                  <td>
                    <Link
                      href="/mapel"
                      className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Pengaturan
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        {/* Generate Laporan */}
        <Card
          title="Generate Laporan"
          action={
            <Link href="/laporan" className="text-xs font-semibold text-blue-600 hover:underline">
              Buka Laporan &rarr;
            </Link>
          }
        >
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-700">Rekap Nilai Sekolah</span>
              <Link
                href="/laporan"
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-700">Rekap Absensi Sekolah</span>
              <Link
                href="/absensi"
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-700">Statistik per Kelas</span>
              <Link
                href="/kelas"
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </li>
          </ul>
        </Card>

        {/* Kelola Aktivitas */}
        <Card title="Kelola Aktivitas">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">Setel Absensi Harian</p>
                <p className="text-xs text-slate-500">Tandai kehadiran siswa per kelas.</p>
              </div>
              <Link
                href="/absensi"
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">Kirim Pengumuman</p>
                <p className="text-xs text-slate-500">Berikan informasi penting kepada sekolah.</p>
              </div>
              <Link
                href="/pengumuman"
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">Manajemen Pengguna</p>
                <p className="text-xs text-slate-500">Kelola akun siswa, guru, dan staf.</p>
              </div>
              <Link
                href="/pengguna"
                className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
              >
                Buka
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Aktivitas Terbaru Sekolah">
        {aktivitasTerbaru.length === 0 ? (
          <EmptyState message="Belum ada aktivitas tercatat." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {aktivitasTerbaru.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      a.status === "HADIR" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="min-w-0 text-sm text-slate-700">
                    {a.siswa.name} — absensi <span className="font-semibold">{a.status}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                  {fmtWaktu(a.tanggal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
