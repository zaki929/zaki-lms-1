import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field, TextArea } from "@/components/forms";
import { createKalender, deleteKalender } from "@/app/actions";

const JENIS_TONE: Record<string, "blue" | "red" | "amber" | "green"> = {
  UJIAN: "red",
  LIBUR: "green",
  RAPAT: "amber",
  KEGIATAN: "blue",
};

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function bulan(d: Date) {
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default async function KalenderPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  const canManage = user.role === "ADMIN" || user.role === "KURIKULUM";

  const agenda = await prisma.kalenderAkademik.findMany({ orderBy: { mulai: "asc" } });

  const grup = new Map<string, typeof agenda>();
  for (const a of agenda) {
    const key = bulan(a.mulai);
    const list = grup.get(key) ?? [];
    list.push(a);
    grup.set(key, list);
  }

  const sekarang = Date.now();

  return (
    <div>
      <PageHeader
        title="Kalender Akademik"
        desc="Agenda kegiatan, ujian, libur, dan rapat sekolah sepanjang tahun ajaran."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {agenda.length === 0 ? (
            <EmptyState message="Belum ada agenda kalender." />
          ) : (
            [...grup.entries()].map(([bulanLabel, daftar]) => (
              <Card key={bulanLabel} title={bulanLabel}>
                <ul className="divide-y divide-slate-100">
                  {daftar.map((a) => {
                    const lewat = (a.selesai ?? a.mulai).getTime() < sekarang - 86400000;
                    return (
                      <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{a.judul}</p>
                          <p className="text-xs text-slate-500">
                            {fmt(a.mulai)}
                            {a.selesai ? ` – ${fmt(a.selesai)}` : ""}
                            {a.keterangan ? ` • ${a.keterangan}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone={JENIS_TONE[a.jenis] ?? "slate"}>{a.jenis}</Badge>
                          {lewat && <Badge tone="slate">Selesai</Badge>}
                          {canManage && (
                            <DeleteForm
                              action={deleteKalender}
                              id={a.id}
                              confirm={`Hapus agenda "${a.judul}"?`}
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))
          )}
        </div>

        {canManage && (
          <div>
            <ActionForm action={createKalender} title="Tambah Agenda">
              <Field label="Judul Agenda" name="judul" required placeholder="Penilaian Tengah Semester" />
              <Field
                label="Jenis"
                name="jenis"
                required
                defaultValue="KEGIATAN"
                options={[
                  { value: "KEGIATAN", label: "Kegiatan" },
                  { value: "UJIAN", label: "Ujian" },
                  { value: "LIBUR", label: "Libur" },
                  { value: "RAPAT", label: "Rapat" },
                ]}
              />
              <Field label="Tanggal Mulai" name="mulai" type="date" required />
              <Field label="Tanggal Selesai" name="selesai" type="date" hint="Opsional." />
              <TextArea label="Keterangan" name="keterangan" rows={2} />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
