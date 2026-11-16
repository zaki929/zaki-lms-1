import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { Badge, Card, DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { ActionForm, Field, TextArea } from "@/components/forms";
import { setAbsensi } from "@/app/actions";

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AbsensiPage() {
  const user = await getSession();
  if (!user) return null;

  // Absensi hanya dipakai Administrator, Kepala Sekolah, dan Kurikulum,
  // jadi tabel selalu menampilkan nama siswa.
  requireRole(user.role, ["ADMIN", "KEPSEK", "KURIKULUM"]);

  // Ketiganya boleh mencatat kehadiran untuk seluruh kelas.
  const canInput = true;

  const kelas = await prisma.kelas.findMany({
    include: { siswa: { select: { id: true, name: true, nis: true } } },
    orderBy: { nama: "asc" },
  });

  const absensi = await prisma.absensi.findMany({
    include: { siswa: { select: { name: true } } },
    orderBy: { tanggal: "desc" },
    take: 50,
  });

  // Rekap harus dihitung dari SELURUH riwayat, bukan dari 50 baris terakhir
  // yang ditampilkan di tabel — kalau tidak, persentasenya tidak akurat.
  const rekap = await prisma.absensi.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const hitung = (s: string) => rekap.find((r) => r.status === s)?._count._all ?? 0;
  const totalRekap = rekap.reduce((a, r) => a + r._count._all, 0);
  const persen = (n: number) =>
    totalRekap === 0 ? "0%" : `${Math.round((n / totalRekap) * 100)}%`;

  // Hanya kelas yang benar-benar punya siswa yang bisa dicatat.
  const kelasInput = kelas.filter((k) => k.siswa.length > 0);

  // Absensi yang sudah tercatat pada tanggal terpilih, supaya pengguna tahu
  // mana yang sudah diisi sebelum menimpa (form memakai upsert).
  const tanggalDefault = new Date().toISOString().slice(0, 10);
  const sudahTerisi = await prisma.absensi.findMany({
    where: { tanggal: new Date(tanggalDefault) },
    select: { siswaId: true, status: true },
  });
  const statusPerSiswa = new Map(sudahTerisi.map((a) => [a.siswaId, a.status]));

  return (
    <div>
      <PageHeader
        title="Absensi"
        desc="Catat kehadiran siswa per tanggal."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hadir" value={hitung("HADIR")} accent="bg-emerald-500" hint={persen(hitung("HADIR"))} />
        <StatCard label="Izin" value={hitung("IZIN")} accent="bg-sky-500" hint={persen(hitung("IZIN"))} />
        <StatCard label="Sakit" value={hitung("SAKIT")} accent="bg-amber-500" hint={persen(hitung("SAKIT"))} />
        <StatCard label="Alfa" value={hitung("ALFA")} accent="bg-rose-500" hint={persen(hitung("ALFA"))} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Rekap dihitung dari seluruh riwayat ({totalRekap} catatan), bukan hanya 50 baris terakhir.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card title={`Riwayat Absensi (${absensi.length})`}>
            {absensi.length === 0 ? (
              <EmptyState message="Belum ada data absensi." />
            ) : (
              <DataTable
                minWidth={480}
                caption="Riwayat absensi"
                head={
                  <>
                    <th scope="col" className="w-[24%]">Tanggal</th>
                    <th scope="col" className="w-[30%]">Siswa</th>
                    <th scope="col" className="w-[20%]">Status</th>
                    <th scope="col" className="w-[26%]">Catatan</th>
                  </>
                }
              >
                {absensi.map((a) => (
                  <tr key={a.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap text-slate-700">{fmt(a.tanggal)}</td>
                    <td className="font-medium text-slate-800">{a.siswa.name}</td>
                    <td>
                      <Badge
                        tone={
                          a.status === "HADIR"
                            ? "green"
                            : a.status === "IZIN"
                              ? "blue"
                              : a.status === "SAKIT"
                                ? "amber"
                                : "red"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="truncate text-slate-500">{a.catatan ?? "-"}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
        </div>

        {canInput && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Pilih kelas, lalu isi tanggal dan status untuk mencatat kehadiran.
            </p>
            {kelasInput.length === 0 ? (
              <EmptyState message="Belum ada kelas yang memiliki siswa." />
            ) : (
              kelasInput.map((k) => (
                <ActionForm key={k.id} action={setAbsensi} title={`Absensi ${k.nama}`}>
                  <input type="hidden" name="kelasId" value={k.id} />
                  {k.siswa.map((s) => (
                    <input key={s.id} type="hidden" name="siswaId" value={s.id} />
                  ))}
                  <Field label="Tanggal" name="tanggal" type="date" required defaultValue={tanggalDefault} />
                  <Field
                    label="Status"
                    name="status"
                    required
                    defaultValue="HADIR"
                    options={[
                      { value: "HADIR", label: "Hadir" },
                      { value: "IZIN", label: "Izin" },
                      { value: "SAKIT", label: "Sakit" },
                      { value: "ALFA", label: "Alfa" },
                    ]}
                  />
                  <TextArea
                    label="Catatan (opsional)"
                    name="catatan"
                    rows={2}
                    placeholder="mis. Izin keluarga, Demam, dsb."
                    hint="Disimpan pada seluruh siswa yang dicatat pada tanggal ini."
                  />
                  <p className="text-xs text-slate-500">
                    Berlaku untuk {k.siswa.length} siswa:{" "}
                    {k.siswa.map((s) => s.name).join(", ")}
                  </p>
                  {(() => {
                    const sudah = k.siswa.filter((s) => statusPerSiswa.has(s.id));
                    if (sudah.length === 0) return null;
                    return (
                      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        Sudah tercatat pada {tanggalDefault}:{" "}
                        {sudah
                          .map((s) => `${s.name} (${statusPerSiswa.get(s.id)})`)
                          .join(", ")}
                        . Menyimpan lagi akan menimpa data tersebut.
                      </p>
                    );
                  })()}
                </ActionForm>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
