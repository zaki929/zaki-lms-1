import { getSession } from "@/lib/auth";
import { prisma, ROLE_LABEL, type Role } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field, TextArea } from "@/components/forms";
import { createPengumuman, deletePengumuman } from "@/app/actions";

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const TARGET = [
  { value: "SEMUA", label: "Semua User" },
  { value: "GURU", label: "Guru" },
  { value: "SISWA", label: "Siswa" },
  { value: "KEPSEK", label: "Kepala Sekolah" },
  { value: "KURIKULUM", label: "Kurikulum" },
];

export default async function PengumumanPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"]);

  const bisaBuat = user.role !== "SISWA";

  const semua = await prisma.pengumuman.findMany({
    where: { OR: [{ target: "SEMUA" }, { target: user.role }] },
    include: { author: { select: { name: true, role: true } } },
    orderBy: { dibuatPada: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pengumuman"
        desc={bisaBuat ? "Kirim pengumuman ke seluruh warga sekolah." : "Informasi terbaru dari sekolah."}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {semua.length === 0 ? (
            <EmptyState message="Belum ada pengumuman." />
          ) : (
            semua.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">{p.judul}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.author.name} • {fmt(p.dibuatPada)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={p.target === "SEMUA" ? "slate" : "blue"}>
                      {p.target === "SEMUA" ? "Semua User" : ROLE_LABEL[p.target as Role] ?? p.target}
                    </Badge>
                    {(user.role === "ADMIN" || p.authorId === user.id) && (
                      <DeleteForm
                        action={deletePengumuman}
                        id={p.id}
                        confirm={`Hapus pengumuman "${p.judul}"?`}
                      />
                    )}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{p.isi}</p>
              </Card>
            ))
          )}
        </div>

        {bisaBuat && (
          <div>
            <ActionForm action={createPengumuman} title="Buat Pengumuman">
              <Field label="Judul" name="judul" required />
              <TextArea
                label="Isi Pengumuman"
                name="isi"
                required
                rows={5}
                hint="Baris baru akan ditampilkan apa adanya."
              />
              <Field label="Ditujukan Untuk" name="target" required defaultValue="SEMUA" options={TARGET} />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
