import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { prisma, ROLE_LABEL } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui";

const STATUS_ABSENSI = [
  { status: "HADIR", label: "Hadir", color: "bg-emerald-500", text: "text-emerald-700" },
  { status: "IZIN", label: "Izin", color: "bg-blue-500", text: "text-blue-700" },
  { status: "SAKIT", label: "Sakit", color: "bg-amber-500", text: "text-amber-700" },
  { status: "ALFA", label: "Alfa", color: "bg-red-500", text: "text-red-700" },
];

const TIPE_NILAI = ["HARIAN", "TUGAS", "UTS", "UAS"];

function fmtTanggal(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function rata(rows: number[]) {
  return rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0;
}

export async function KepsekDashboard({ user }: { user: SessionUser }) {
  const [totalSiswa, totalGuru, totalKelas, absensi, nilai, kelasData, guruList, totalTugas, totalPengumpulan] =
    await Promise.all([
      prisma.user.count({ where: { role: "SISWA" } }),
      prisma.user.count({ where: { role: "GURU" } }),
      prisma.kelas.count(),
      prisma.absensi.findMany({ select: { siswaId: true, status: true, tanggal: true } }),
      prisma.nilai.findMany({ select: { siswaId: true, tipe: true, nilai: true } }),
      prisma.kelas.findMany({
        select: { id: true, nama: true, siswa: { select: { id: true } } },
        orderBy: { nama: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "GURU" },
        select: {
          id: true,
          name: true,
          tugasDibuat: {
            select: { judul: true, dibuatPada: true },
            orderBy: { dibuatPada: "desc" },
            take: 1,
          },
          _count: { select: { tugasDibuat: true, nilaiDiberi: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.tugas.count(),
      prisma.pengumpulan.count(),
    ]);

  const totalAbsensi = absensi.length;
  const totalHadir = absensi.filter((a) => a.status === "HADIR").length;
  const persenHadir = totalAbsensi ? (totalHadir / totalAbsensi) * 100 : 0;

  const perStatus = STATUS_ABSENSI.map((s) => ({
    ...s,
    jumlah: absensi.filter((a) => a.status === s.status).length,
  }));

  const perTipe = TIPE_NILAI.map((tipe) => {
    const rows = nilai.filter((n) => n.tipe === tipe).map((n) => n.nilai);
    return { tipe, avg: rata(rows), jumlah: rows.length };
  });

  const nilaiPerSiswa = new Map<string, number[]>();
  for (const n of nilai) {
    const list = nilaiPerSiswa.get(n.siswaId) ?? [];
    list.push(n.nilai);
    nilaiPerSiswa.set(n.siswaId, list);
  }

  const absensiPerSiswa = new Map<string, string[]>();
  for (const a of absensi) {
    const list = absensiPerSiswa.get(a.siswaId) ?? [];
    list.push(a.status);
    absensiPerSiswa.set(a.siswaId, list);
  }

  const kelasStat = kelasData.map((k) => {
    const nilaiKelas = k.siswa.flatMap((s) => nilaiPerSiswa.get(s.id) ?? []);
    const absensiKelas = k.siswa.flatMap((s) => absensiPerSiswa.get(s.id) ?? []);
    const hadir = absensiKelas.filter((s) => s === "HADIR").length;
    return {
      id: k.id,
      nama: k.nama,
      jumlahSiswa: k.siswa.length,
      jumlahNilai: nilaiKelas.length,
      rataNilai: rata(nilaiKelas),
      kehadiran: absensiKelas.length ? (hadir / absensiKelas.length) * 100 : 0,
    };
  });

  const kelasByNilai = [...kelasStat].sort((a, b) => b.rataNilai - a.rataNilai);
  const rataSekolah = rata(nilai.map((n) => n.nilai));

  const batasAktif = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user.name.split(",")[0]}`}
        desc={`Ringkasan performa sekolah — Anda login sebagai ${ROLE_LABEL[user.role]}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Siswa" value={totalSiswa} accent="bg-emerald-500" />
        <StatCard label="Total Guru" value={totalGuru} accent="bg-sky-500" />
        <StatCard label="Total Kelas" value={totalKelas} accent="bg-amber-500" />
        <StatCard
          label="Persentase Kehadiran"
          value={`${persenHadir.toFixed(1)}%`}
          accent="bg-blue-500"
          hint={`${totalHadir} hadir dari ${totalAbsensi} catatan`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Grafik Perkembangan Akademik">
            <p className="mb-4 text-xs text-slate-500">
              Rata-rata nilai seluruh sekolah per jenis penilaian.
            </p>
            {nilai.length === 0 ? (
              <EmptyState message="Belum ada data nilai." />
            ) : (
              <div className="flex h-44 items-end justify-around gap-4 border-b border-slate-200 pb-2">
                {perTipe.map((t) => (
                  <div key={t.tipe} className="flex h-full w-full max-w-16 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-semibold tabular-nums text-slate-700">
                      {t.jumlah ? t.avg.toFixed(1) : "-"}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-blue-500"
                      style={{ height: `${Math.min(100, t.avg)}%` }}
                      title={`${t.tipe}: ${t.jumlah} nilai`}
                    />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {t.tipe}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.jumlah} nilai</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Statistik Nilai Seluruh Kelas"
            action={
              <Link href="/laporan" className="text-xs font-semibold text-blue-600 hover:underline">
                Laporan lengkap
              </Link>
            }
          >
            {kelasByNilai.length === 0 ? (
              <EmptyState message="Belum ada kelas." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2">Kelas</th>
                    <th className="py-2 text-right">Siswa</th>
                    <th className="py-2 text-right">Nilai</th>
                    <th className="py-2 text-right">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kelasByNilai.map((k) => (
                    <tr key={k.id}>
                      <td className="py-2 font-medium text-slate-800">{k.nama}</td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{k.jumlahSiswa}</td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{k.jumlahNilai}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-slate-800">
                        {k.jumlahNilai ? k.rataNilai.toFixed(1) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Perbandingan Perkembangan Kelas">
            <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-full bg-blue-500" aria-hidden="true" /> Rata-rata nilai
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-full bg-emerald-500" aria-hidden="true" /> Kehadiran
              </span>
            </div>
            {kelasStat.length === 0 ? (
              <EmptyState message="Belum ada kelas." />
            ) : (
              <ul className="space-y-4">
                {kelasStat.map((k) => (
                  <li key={k.id}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-700">{k.nama}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">
                        {k.jumlahNilai ? k.rataNilai.toFixed(1) : "-"} / {k.kehadiran.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.min(100, k.rataNilai)}%` }}
                        />
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, k.kehadiran)}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Rekap Absensi Sekolah">
            {totalAbsensi === 0 ? (
              <EmptyState message="Belum ada data absensi." />
            ) : (
              <>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{persenHadir.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">tingkat kehadiran keseluruhan</p>
                <ul className="mt-4 space-y-3">
                  {perStatus.map((s) => (
                    <li key={s.status}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${s.text}`}>{s.label}</span>
                        <span className="tabular-nums text-slate-500">
                          {s.jumlah} ({totalAbsensi ? ((s.jumlah / totalAbsensi) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${s.color}`}
                          style={{ width: `${totalAbsensi ? (s.jumlah / totalAbsensi) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card title="Monitoring Aktivitas Guru">
            {guruList.length === 0 ? (
              <EmptyState message="Belum ada guru." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {guruList.map((g) => {
                  const terakhir = g.tugasDibuat[0]?.dibuatPada;
                  const aktif = terakhir ? terakhir.getTime() >= batasAktif : false;
                  return (
                    <li key={g.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-slate-800">{g.name}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            aktif
                              ? "bg-emerald-100 text-emerald-700"
                              : terakhir
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {aktif ? "Aktif" : terakhir ? "Jarang" : "Belum ada"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {g._count.tugasDibuat} tugas • {g._count.nilaiDiberi} nilai
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {terakhir ? `Terakhir: ${fmtTanggal(terakhir)}` : "Belum membuat tugas"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title="Laporan Akademik"
            action={
              <Link href="/laporan" className="text-xs font-semibold text-blue-600 hover:underline">
                Buka
              </Link>
            }
          >
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex justify-between gap-2">
                <span>Rata-rata nilai sekolah</span>
                <b className="tabular-nums text-slate-800">
                  {nilai.length ? rataSekolah.toFixed(2) : "-"}
                </b>
              </li>
              <li className="flex justify-between gap-2">
                <span>Total nilai tercatat</span>
                <b className="tabular-nums text-slate-800">{nilai.length}</b>
              </li>
              <li className="flex justify-between gap-2">
                <span>Total tugas</span>
                <b className="tabular-nums text-slate-800">{totalTugas}</b>
              </li>
              <li className="flex justify-between gap-2">
                <span>Pengumpulan tugas</span>
                <b className="tabular-nums text-slate-800">{totalPengumpulan}</b>
              </li>
              <li className="flex justify-between gap-2">
                <span>Kelas terbaik</span>
                <b className="truncate text-slate-800">
                  {kelasByNilai[0]?.jumlahNilai ? kelasByNilai[0].nama : "-"}
                </b>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
