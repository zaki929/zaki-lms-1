import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRED_TONE, predikat } from "@/lib/grading";
import { requireRole } from "@/lib/guard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, DeleteForm, Field, GradeForm, TextArea } from "@/components/forms";
import { createTugas, deleteTugas, submitTugas } from "@/app/actions";

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date) {
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDeadline(d: Date) {
  return `${fmt(d)} pukul ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default async function TugasPage() {
  const user = await getSession();
  if (!user) return null;
  requireRole(user.role, ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"]);

  const isSiswa = user.role === "SISWA";
  const isGuru = user.role === "GURU";
  // Guru hanya menilai tugasnya sendiri; admin boleh menilai semua.
  const canGradeThis = user.role === "ADMIN" || isGuru;

  // `include` dibuat seragam untuk semua role supaya tipe hasilnya tidak
  // bercabang (sebelumnya perlu cast `as unknown as` saat merender).
  const tugas = await prisma.tugas.findMany({
    where: isSiswa
      ? { kelas: { siswa: { some: { id: user.id } } } }
      : isGuru
        ? { guruId: user.id }
        : {},
    include: {
      mapel: true,
      kelas: true,
      guru: { select: { name: true } },
      pengumpulan: {
        include: { siswa: { select: { id: true, name: true } } },
        orderBy: { submitPada: "desc" },
      },
    },
    orderBy: { deadline: "asc" },
  });

  // Untuk siswa, hanya pengumpulan miliknya sendiri yang relevan.
  const tugasView = isSiswa
    ? tugas.map((t) => ({
        ...t,
        pengumpulan: t.pengumpulan.filter((p) => p.siswaId === user.id),
      }))
    : tugas;

  const kelas = await prisma.kelas.findMany({
    include: { mapel: { select: { id: true, nama: true } } },
    orderBy: { nama: "asc" },
  });

  const mapelOptions = Array.from(
    new Map(kelas.flatMap((k) => k.mapel.map((m) => [m.id, m.nama]))).entries()
  ).map(([id, nama]) => ({ value: id, label: nama }));

  return (
    <div>
      <PageHeader
        title="Tugas & Pengumpulan"
        desc={isSiswa ? "Kerjakan dan kumpulkan tugas dari guru." : "Buat tugas, kumpulkan, dan pantau kiriman siswa."}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {tugasView.length === 0 ? (
            <EmptyState message="Belum ada tugas." />
          ) : (
            tugasView.map((t) => {
              const sudah = t.pengumpulan.length > 0;
              const lewat = t.deadline < new Date();
              return (
                <Card key={t.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-800">{t.judul}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t.kelas.nama} • {t.mapel.nama} • Guru: {t.guru.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isSiswa ? (
                        sudah ? (
                          <Badge tone="green">Sudah dikumpulkan</Badge>
                        ) : lewat ? (
                          <Badge tone="red">Terlambat</Badge>
                        ) : (
                          <Badge tone="blue">Belum</Badge>
                        )
                      ) : (
                        <Badge tone="violet">{t.pengumpulan.length} pengumpulan</Badge>
                      )}
                      {!isSiswa && (user.role === "ADMIN" || t.guruId === user.id) && (
                        <DeleteForm
                          action={deleteTugas}
                          id={t.id}
                          confirm={`Hapus tugas "${t.judul}" beserta semua pengumpulan siswa?`}
                        />
                      )}
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{t.deskripsi}</p>
                  {t.lampiran && (
                    <a
                      href={t.lampiran}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7" />
                        <path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" />
                      </svg>
                      Buka lampiran
                    </a>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Deadline: {fmtDeadline(t.deadline)}
                    {lewat && !sudah && (
                      <span className="ml-2 font-medium text-rose-600">sudah lewat</span>
                    )}
                  </p>

                  {isSiswa && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {sudah && (
                        <div className="mb-3 space-y-2">
                          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            Terkirim: {t.pengumpulan[0].file ?? "tanpa file"} •{" "}
                            {fmtDateTime(t.pengumpulan[0].submitPada)}
                          </p>
                          {t.pengumpulan[0].nilaiAkhir !== null && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                              <span className="text-sm font-medium text-indigo-900">
                                Nilai dari guru:
                              </span>
                              <Badge tone={PRED_TONE[predikat(t.pengumpulan[0].nilaiAkhir)]}>
                                {t.pengumpulan[0].nilaiAkhir} · {predikat(t.pengumpulan[0].nilaiAkhir)}
                              </Badge>
                              {t.pengumpulan[0].catatan && (
                                <span className="text-sm text-indigo-700">
                                  — {t.pengumpulan[0].catatan}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <ActionForm
                        action={submitTugas}
                        title={sudah ? "Perbarui Pengumpulan" : "Kumpulkan Tugas"}
                      >
                        <input type="hidden" name="tugasId" value={t.id} />
                        <Field
                          label="Nama file / link"
                          name="file"
                          placeholder="tugas-01.pdf"
                          hint="Tulis nama file yang sudah diunggah atau tautan Drive."
                        />
                        <TextArea label="Catatan" name="catatan" rows={2} />
                      </ActionForm>
                    </div>
                  )}

                  {!isSiswa && t.pengumpulan.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pengumpulan ({t.pengumpulan.length})
                      </p>
                      <ul className="space-y-2">
                        {t.pengumpulan.map((p) => (
                          <li
                            key={p.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm text-slate-700">
                                <span className="font-medium">{p.siswa.name}</span> — {p.file ?? "tanpa file"}
                                <span className="ml-1 text-xs text-slate-400">
                                  ({fmtDateTime(p.submitPada)})
                                </span>
                              </p>
                              {p.nilaiAkhir !== null && (
                                <Badge tone={PRED_TONE[predikat(p.nilaiAkhir)]}>
                                  {p.nilaiAkhir} · {predikat(p.nilaiAkhir)}
                                </Badge>
                              )}
                            </div>
                            {canGradeThis && (
                              <GradeForm
                                id={p.id}
                                defaultNilai={p.nilaiAkhir}
                                defaultCatatan={p.catatan}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {!isSiswa && (isGuru || user.role === "ADMIN") && (
          <div>
            <ActionForm action={createTugas} title="Buat Tugas Baru">
              <Field label="Judul" name="judul" required />
              <TextArea label="Deskripsi" name="deskripsi" required />
              <Field
                label="Kelas"
                name="kelasId"
                required
                options={kelas.map((k) => ({ value: k.id, label: k.nama }))}
              />
              <Field label="Mata Pelajaran" name="mapelId" required options={mapelOptions} />
              <Field label="Deadline" name="deadline" type="datetime-local" required hint="Waktu batas siswa mengumpulkan tugas." />
              <Field
                label="Link Lampiran (opsional)"
                name="lampiran"
                type="url"
                placeholder="https://drive.google.com/..."
                hint="Tempel URL materi soal/panduan yang bisa diakses siswa."
              />
            </ActionForm>
          </div>
        )}
      </div>
    </div>
  );
}
