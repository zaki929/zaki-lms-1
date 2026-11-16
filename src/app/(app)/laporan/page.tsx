import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Card, DataTable, PageHeader, StatCard } from "@/components/ui";

export default async function LaporanPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const perKelas = await prisma.kelas.findMany({
    include: {
      siswa: { select: { id: true } },
      guru: { select: { name: true } },
      _count: { select: { tugas: true, jadwal: true } },
    },
    orderBy: { nama: "asc" },
  });

  const perSiswa = await prisma.user.findMany({
    where: { role: "SISWA" },
    include: {
      nilai: true,
      absensi: true,
      pengumpulan: true,
    },
    orderBy: { name: "asc" },
  });

  const totalNilai = perSiswa.reduce(
    (acc, s) => acc + s.nilai.reduce((a, b) => a + b.nilai, 0),
    0
  );
  const jumlahNilai = perSiswa.reduce((acc, s) => acc + s.nilai.length, 0);
  const rataSekolah = jumlahNilai ? (totalNilai / jumlahNilai).toFixed(2) : "0";

  const totalAbsensi = perSiswa.reduce((acc, s) => acc + s.absensi.length, 0);
  const totalHadir = perSiswa.reduce(
    (acc, s) => acc + s.absensi.filter((a) => a.status === "HADIR").length,
    0
  );
  // Schema lama membolehkan absensi kosong, jadi pembagi harus dijaga agar tidak NaN.
  const persenHadir = totalAbsensi
    ? ((totalHadir / totalAbsensi) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      <PageHeader title="Laporan & Statistik" desc="Rekap data seluruh sekolah." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rata-rata Nilai" value={rataSekolah} accent="bg-indigo-500" />
        <StatCard label="Kehadiran" value={`${persenHadir}%`} accent="bg-emerald-500" />
        <StatCard label="Jumlah Siswa" value={perSiswa.length} accent="bg-amber-500" />
        <StatCard label="Jumlah Kelas" value={perKelas.length} accent="bg-violet-500" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Statistik per Kelas">
          <DataTable
            minWidth={420}
            caption="Statistik per kelas"
            head={
              <>
                <th scope="col" className="w-[28%]">Kelas</th>
                <th scope="col" className="w-[32%]">Guru</th>
                <th scope="col" className="w-[12%] text-right">Siswa</th>
                <th scope="col" className="w-[14%] text-right">Tugas</th>
                <th scope="col" className="w-[14%] text-right">Jadwal</th>
              </>
            }
          >
            {perKelas.map((k) => (
              <tr key={k.id} className="transition hover:bg-slate-50">
                <td className="font-medium text-slate-800">{k.nama}</td>
                <td className="truncate text-slate-500">{k.guru?.name ?? "-"}</td>
                <td className="text-right text-slate-600">{k.siswa.length}</td>
                <td className="text-right text-slate-600">{k._count.tugas}</td>
                <td className="text-right text-slate-600">{k._count.jadwal}</td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <Card title="Prestasi Siswa">
          <DataTable
            minWidth={400}
            caption="Prestasi siswa"
            head={
              <>
                <th scope="col" className="w-[34%]">Siswa</th>
                <th scope="col" className="w-[22%] text-right">Rata Nilai</th>
                <th scope="col" className="w-[22%] text-right">Hadir</th>
                <th scope="col" className="w-[22%] text-right">Kumpulkan</th>
              </>
            }
          >
            {perSiswa.map((s) => {
              const rata = s.nilai.length
                ? (s.nilai.reduce((a, b) => a + b.nilai, 0) / s.nilai.length).toFixed(1)
                : "-";
              const hadir = s.absensi.filter((a) => a.status === "HADIR").length;
              return (
                <tr key={s.id} className="transition hover:bg-slate-50">
                  <td className="truncate font-medium text-slate-800">{s.name}</td>
                  <td className="text-right font-semibold text-slate-700">{rata}</td>
                  <td className="text-right text-slate-600">
                    {hadir}/{s.absensi.length}
                  </td>
                  <td className="text-right text-slate-600">{s.pengumpulan.length}</td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      </div>
    </div>
  );
}
