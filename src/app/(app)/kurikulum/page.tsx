import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";

const JENIS_TONE: Record<string, "blue" | "red" | "amber" | "green"> = {
  UJIAN: "red",
  LIBUR: "green",
  RAPAT: "amber",
  KEGIATAN: "blue",
};

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function KurikulumPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const [mapel, totalCp, totalTp, totalAtp, modul, kalender, guruList, totalKelas, totalGuru] =
    await Promise.all([
      prisma.mapel.findMany({
        include: {
          _count: { select: { capaian: true, modulAjar: true } },
        },
        orderBy: { nama: "asc" },
      }),
      prisma.capaian.count(),
      prisma.tujuan.count(),
      prisma.atp.count(),
      prisma.modulAjar.findMany({
        include: { guru: { select: { name: true } }, mapel: { select: { nama: true } } },
        orderBy: { dibuatPada: "desc" },
      }),
      prisma.kalenderAkademik.findMany({ orderBy: { mulai: "asc" } }),
      prisma.user.findMany({
        where: { role: "GURU" },
        select: { id: true, name: true, modulAjar: { select: { status: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.kelas.count(),
      prisma.user.count({ where: { role: "GURU" } }),
    ]);

  const modulSelesai = modul.filter((m) => m.status === "SELESAI").length;
  const modulReview = modul.filter((m) => m.status === "REVIEW").length;
  const modulDraft = modul.filter((m) => m.status === "DRAFT").length;

  const guruLengkap = guruList.filter((g) => g.modulAjar.some((m) => m.status === "SELESAI"));
  const guruBelum = guruList.filter((g) => !g.modulAjar.some((m) => m.status === "SELESAI"));
  const persenLengkap = totalGuru ? (guruLengkap.length / totalGuru) * 100 : 0;

  const agendaMendatang = kalender
    .filter((k) => (k.selesai ?? k.mulai).getTime() >= Date.now() - 86400000)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kurikulum Sekolah"
        desc="Pengelolaan CP, TP, ATP, modul ajar, mata pelajaran, kalender akademik, dan monitoring perangkat pembelajaran guru."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Mata Pelajaran" value={mapel.length} accent="bg-blue-500" />
        <StatCard label="Capaian (CP)" value={totalCp} accent="bg-sky-500" />
        <StatCard label="TP / ATP" value={`${totalTp} / ${totalAtp}`} accent="bg-emerald-500" />
        <StatCard label="Modul Ajar" value={modul.length} accent="bg-amber-500" hint={`${modulSelesai} selesai`} />
        <StatCard label="Agenda Kalender" value={kalender.length} accent="bg-slate-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Manajemen Kurikulum Sekolah">
          <ul className="grid grid-cols-2 gap-3 text-sm">
            <li className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Mata Pelajaran</p>
              <p className="text-xl font-bold text-slate-800">{mapel.length}</p>
            </li>
            <li className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Kelas</p>
              <p className="text-xl font-bold text-slate-800">{totalKelas}</p>
            </li>
            <li className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Guru</p>
              <p className="text-xl font-bold text-slate-800">{totalGuru}</p>
            </li>
            <li className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Modul Ajar</p>
              <p className="text-xl font-bold text-slate-800">{modul.length}</p>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
            <Link href="/kurikulum/cp-tp-atp" className="text-blue-600 hover:underline">
              CP / TP / ATP &rarr;
            </Link>
            <Link href="/kurikulum/modul-ajar" className="text-blue-600 hover:underline">
              Modul ajar &rarr;
            </Link>
            <Link href="/kurikulum/kalender" className="text-blue-600 hover:underline">
              Kalender &rarr;
            </Link>
            <Link href="/mapel" className="text-blue-600 hover:underline">
              Mata pelajaran &rarr;
            </Link>
          </div>
        </Card>

        <Card
          title="Pengelolaan CP, TP, dan ATP"
          action={
            <Link href="/kurikulum/cp-tp-atp" className="text-xs font-medium text-blue-600 hover:underline">
              Kelola
            </Link>
          }
        >
          {mapel.length === 0 ? (
            <EmptyState message="Belum ada mata pelajaran." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {mapel.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{m.nama}</p>
                    <p className="text-xs text-slate-500">{m.kode}</p>
                  </div>
                  <Badge tone={m._count.capaian ? "green" : "slate"}>
                    {m._count.capaian} CP
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Pengelolaan Modul Ajar"
          action={
            <Link href="/kurikulum/modul-ajar" className="text-xs font-medium text-blue-600 hover:underline">
              Kelola
            </Link>
          }
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="green">{modulSelesai} selesai</Badge>
            <Badge tone="amber">{modulReview} review</Badge>
            <Badge tone="slate">{modulDraft} draft</Badge>
          </div>
          {modul.length === 0 ? (
            <EmptyState message="Belum ada modul ajar." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {modul.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{m.judul}</p>
                    <p className="truncate text-xs text-slate-500">
                      {m.mapel.nama} &bull; {m.guru.name}
                    </p>
                  </div>
                  <Badge
                    tone={m.status === "SELESAI" ? "green" : m.status === "REVIEW" ? "amber" : "slate"}
                  >
                    {m.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Pengelolaan Kalender Akademik"
          action={
            <Link href="/kurikulum/kalender" className="text-xs font-medium text-blue-600 hover:underline">
              Kelola
            </Link>
          }
        >
          {agendaMendatang.length === 0 ? (
            <EmptyState message="Belum ada agenda mendatang." />
          ) : (
            <ul className="space-y-3">
              {agendaMendatang.map((k) => (
                <li key={k.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{k.judul}</p>
                    <p className="text-xs text-slate-500">
                      {fmt(k.mulai)}
                      {k.selesai ? ` – ${fmt(k.selesai)}` : ""}
                    </p>
                  </div>
                  <Badge tone={JENIS_TONE[k.jenis] ?? "slate"}>{k.jenis}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Pengaturan Mata Pelajaran">
          <div className="flex flex-wrap gap-2">
            {mapel.length === 0 ? (
              <EmptyState message="Belum ada mata pelajaran." />
            ) : (
              mapel.map((m) => (
                <Badge key={m.id} tone="blue">
                  {m.nama} ({m.kode})
                </Badge>
              ))
            )}
          </div>
          <Link
            href="/mapel"
            className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline"
          >
            Buka pengaturan mata pelajaran &rarr;
          </Link>
        </Card>

        <Card
          title="Monitoring Perangkat Pembelajaran Guru"
          action={
            <Link href="/kurikulum/monitoring" className="text-xs font-medium text-blue-600 hover:underline">
              Detail
            </Link>
          }
        >
          {guruList.length === 0 ? (
            <EmptyState message="Belum ada guru." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {guruList.map((g) => {
                const selesai = g.modulAjar.filter((m) => m.status === "SELESAI").length;
                return (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-sm text-slate-800">{g.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {g.modulAjar.length} modul &bull; {selesai} selesai
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Laporan Kelengkapan Administrasi Pembelajaran"
        action={
          <Link href="/kurikulum/monitoring" className="text-xs font-medium text-blue-600 hover:underline">
            Laporan lengkap
          </Link>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-slate-800">{persenLengkap.toFixed(0)}%</p>
            <p className="text-xs text-slate-500">
              {guruLengkap.length} dari {totalGuru} guru punya minimal satu modul ajar berstatus SELESAI
            </p>
          </div>
          <div className="min-w-48 flex-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${persenLengkap}%` }}
              />
            </div>
            {guruBelum.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                Belum lengkap: {guruBelum.map((g) => g.name).join(", ")}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
