import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field, TextArea } from "@/components/forms";
import { EditModulAjarForm } from "@/components/kurikulum-forms";
import { createModulAjar, deleteModulAjar } from "@/app/actions";

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ModulAjarPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const canManage = user.role === "ADMIN" || user.role === "KURIKULUM";

  const [modul, mapel, kelas, guru] = await Promise.all([
    prisma.modulAjar.findMany({
      include: { mapel: true, kelas: true, guru: { select: { name: true } } },
      orderBy: { dibuatPada: "desc" },
    }),
    prisma.mapel.findMany({ orderBy: { nama: "asc" } }),
    prisma.kelas.findMany({ orderBy: { nama: "asc" } }),
    prisma.user.findMany({ where: { role: "GURU" }, orderBy: { name: "asc" } }),
  ]);

  const opsiMapel = mapel.map((m) => ({ value: m.id, label: `${m.nama} (${m.kode})` }));
  const opsiKelas = kelas.map((k) => ({ value: k.id, label: k.nama }));
  const opsiGuru = guru.map((g) => ({ value: g.id, label: g.name }));

  const hitung = (status: string) => modul.filter((m) => m.status === status).length;

  return (
    <div>
      <PageHeader
        title="Modul Ajar"
        desc="Pengelolaan modul ajar / perangkat pembelajaran yang disusun guru."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="green">{hitung("SELESAI")} selesai</Badge>
        <Badge tone="amber">{hitung("REVIEW")} review</Badge>
        <Badge tone="slate">{hitung("DRAFT")} draft</Badge>
        <Badge tone="blue">{modul.length} total</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {modul.length === 0 ? (
            <EmptyState message="Belum ada modul ajar." />
          ) : (
            modul.map((m) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">{m.judul}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {m.mapel.nama}
                      {m.kelas ? ` • ${m.kelas.nama}` : ""} • {m.guru.name}
                    </p>
                    {m.file && <p className="mt-1 text-xs text-slate-400">Berkas: {m.file}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={m.status === "SELESAI" ? "green" : m.status === "REVIEW" ? "amber" : "slate"}
                    >
                      {m.status}
                    </Badge>
                    {canManage && (
                      <>
                        <EditModulAjarForm
                          modul={m}
                          mapel={opsiMapel}
                          kelas={opsiKelas}
                          guru={opsiGuru}
                        />
                        <DeleteForm
                          action={deleteModulAjar}
                          id={m.id}
                          confirm={`Hapus modul ajar "${m.judul}"?`}
                        />
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Ditambahkan {fmt(m.dibuatPada)}</p>
              </Card>
            ))
          )}
        </div>

        {canManage && (
          <div>
            <ActionForm action={createModulAjar} title="Tambah Modul Ajar">
              <TextArea label="Judul Modul" name="judul" required rows={2} />
              <Field label="Mata Pelajaran" name="mapelId" required options={opsiMapel} />
              <Field label="Kelas" name="kelasId" options={opsiKelas} />
              <Field label="Guru Penyusun" name="guruId" required options={opsiGuru} />
              <Field
                label="Status"
                name="status"
                required
                defaultValue="DRAFT"
                options={[
                  { value: "DRAFT", label: "Draft" },
                  { value: "REVIEW", label: "Review" },
                  { value: "SELESAI", label: "Selesai" },
                ]}
              />
              <Field label="Berkas" name="file" placeholder="modul-ajar.pdf" hint="Nama/tautan berkas (opsional)." />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
