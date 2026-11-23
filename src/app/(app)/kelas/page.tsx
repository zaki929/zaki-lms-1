import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, EditKelasForm, Field, MultiSelect } from "@/components/forms";
import { createKelas, deleteKelas } from "@/app/actions";

export default async function KelasPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"]);

  const isSiswa = user.role === "SISWA";
  const isAdmin = user.role === "ADMIN";

  const kelas = await prisma.kelas.findMany({
    where: isSiswa ? { siswa: { some: { id: user.id } } } : {},
    include: {
      guru: { select: { name: true } },
      siswa: { select: { id: true, name: true, nis: true } },
      mapel: { select: { nama: true } },
      _count: { select: { tugas: true, jadwal: true } },
    },
    orderBy: { nama: "asc" },
  });

  const guru = await prisma.user.findMany({
    where: { role: "GURU" },
    orderBy: { name: "asc" },
  });
  const siswa = await prisma.user.findMany({
    where: { role: "SISWA" },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Data Kelas"
        desc={
          isSiswa
            ? "Kelas yang Anda ikuti beserta guru pengampu dan mata pelajaran."
            : "Informasi kelas, wali kelas, dan anggota."
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {kelas.length === 0 ? (
            <EmptyState message="Belum ada kelas." />
          ) : (
            kelas.map((k) => (
              <Card key={k.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">{k.nama}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Tingkat {k.tingkat} • TA {k.tahun} • Wali: {k.wali ?? "-"}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2">
                      <EditKelasForm kelas={k} allGuru={guru} allSiswa={siswa} />
                      <DeleteForm
                        action={deleteKelas}
                        id={k.id}
                        confirm={`Hapus kelas ${k.nama}? Semua tugas dan jadwal kelas ini ikut terhapus.`}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="blue">{k.siswa.length} siswa</Badge>
                  <Badge tone="violet">{k.mapel.length} mapel</Badge>
                  <Badge tone="amber">{k._count.tugas} tugas</Badge>
                  <Badge tone="slate">{k._count.jadwal} jadwal</Badge>
                </div>

                <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 font-medium text-slate-500">Guru</dt>
                    <dd>{k.guru?.name ?? "-"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 font-medium text-slate-500">Siswa</dt>
                    <dd className="min-w-0">
                      {k.siswa.map((s) => s.name).join(", ") || "-"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 font-medium text-slate-500">Mapel</dt>
                    <dd className="min-w-0">
                      {k.mapel.map((m) => m.nama).join(", ") || "-"}
                    </dd>
                  </div>
                </dl>
              </Card>
            ))
          )}
        </div>

        {isAdmin && (
          <div>
            <ActionForm action={createKelas} title="Tambah Kelas">
              <Field label="Nama Kelas" name="nama" required placeholder="XII PPLG 1" />
              <Field
                label="Tingkat"
                name="tingkat"
                required
                options={["X", "XI", "XII"].map((t) => ({ value: t, label: t }))}
              />
              <Field label="Tahun Ajaran" name="tahun" required defaultValue="2025/2026" />
              <Field label="Wali Kelas" name="wali" hint="Nama wali kelas, boleh dikosongkan." />
              <Field
                label="Guru Pengampu"
                name="guruId"
                options={guru.map((g) => ({ value: g.id, label: g.name }))}
              />
              <MultiSelect
                label="Anggota Siswa"
                name="siswaId"
                options={siswa.map((s) => ({ value: s.id, label: `${s.name} (${s.nis ?? "-"})` }))}
              />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
