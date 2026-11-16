import { getSession } from "@/lib/auth";
import { prisma, ROLE_LABEL } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { Badge, Card, DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { ActionForm, Field } from "@/components/forms";
import { updatePassword } from "@/app/actions";
import { predikat, PRED_TONE } from "@/lib/grading";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function fmt(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ProfilPage() {
  const user = await getSession();
  if (!user) return null;

  const akun = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      nis: true,
      nip: true,
      phone: true,
      gender: true,
      active: true,
      createdAt: true,
    },
  });
  if (!akun) return null;

  const kelasDiikuti = await prisma.kelas.findMany({
    where: { siswa: { some: { id: user.id } } },
    select: { id: true, nama: true, tingkat: true },
    orderBy: { nama: "asc" },
  });

  const kelasDiajar = await prisma.kelas.findMany({
    where: { guruId: user.id },
    select: { id: true, nama: true, tingkat: true },
    orderBy: { nama: "asc" },
  });

  // Rekap pribadi, hanya untuk siswa (guru/petugas tidak punya rapor).
  const isSiswa = akun.role === "SISWA";
  const [nilai, absensi, tugasKumpul] = isSiswa
    ? await Promise.all([
        prisma.nilai.findMany({ where: { siswaId: user.id } }),
        prisma.absensi.findMany({ where: { siswaId: user.id } }),
        prisma.pengumpulan.count({ where: { siswaId: user.id } }),
      ])
    : [[], [], 0];

  const rata = nilai.length
    ? (nilai.reduce((a, b) => a + b.nilai, 0) / nilai.length).toFixed(1)
    : "0";
  const hadir = absensi.filter((a) => a.status === "HADIR").length;
  const persenHadir = absensi.length ? Math.round((hadir / absensi.length) * 100) : 0;

  // Jadwal hari ini — sama persis dengan yang dilihat di halaman Jadwal,
  // supaya tidak ada dua definisi "jadwal hari ini" di aplikasi.
  const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long" });
  const jadwalHariIni = await prisma.jadwal.findMany({
    where: isSiswa
      ? { hari: hariIni, kelas: { siswa: { some: { id: user.id } } } }
      : akun.role === "GURU"
        ? { hari: hariIni, kelas: { guruId: user.id } }
        : { hari: hariIni },
    include: { mapel: { select: { nama: true } }, kelas: { select: { nama: true } } },
    orderBy: { jamMulai: "asc" },
    take: 8,
  });

  const inisial = akun.name
    .replace(/[^A-Za-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const info = [
    { label: "Nama lengkap", value: akun.name },
    { label: "Email", value: akun.email },
    { label: "Role", value: ROLE_LABEL[akun.role as keyof typeof ROLE_LABEL] ?? akun.role },
    { label: akun.role === "SISWA" ? "NIS" : "NIP", value: akun.nis ?? akun.nip ?? "-" },
    { label: "No. HP", value: akun.phone ?? "-" },
    { label: "Jenis kelamin", value: akun.gender === "L" ? "Laki-laki" : akun.gender === "P" ? "Perempuan" : "-" },
    { label: "Akun dibuat", value: fmt(akun.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Profil Saya" desc="Informasi akun dan keamanan login Anda." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-semibold text-white"
                aria-hidden="true"
              >
                {inisial || akun.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-800">{akun.name}</p>
                <p className="truncate text-sm text-slate-500">{akun.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Badge tone="violet">{ROLE_LABEL[akun.role as keyof typeof ROLE_LABEL] ?? akun.role}</Badge>
                  <Badge tone={akun.active ? "green" : "red"}>
                    {akun.active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              {info.map((i) => (
                <div key={i.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {i.label}
                  </dt>
                  <dd className="mt-0.5 truncate text-sm text-slate-700">{i.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {isSiswa && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Rata-rata Nilai" value={rata} accent="bg-indigo-500" />
                <StatCard
                  label="Kehadiran"
                  value={`${persenHadir}%`}
                  hint={`${hadir} dari ${absensi.length} hari`}
                  accent="bg-emerald-500"
                />
                <StatCard label="Tugas Dikumpulkan" value={tugasKumpul} accent="bg-amber-500" />
              </div>

              <Card title={`Nilai Saya (${nilai.length})`}>
                {nilai.length === 0 ? (
                  <EmptyState message="Belum ada nilai." />
                ) : (
                  <DataTable
                    minWidth={420}
                    caption="Daftar nilai saya"
                    head={
                      <>
                        <th scope="col" className="w-[26%]">Jenis</th>
                        <th scope="col" className="w-[16%]">Semester</th>
                        <th scope="col" className="w-[16%] text-right">Nilai</th>
                        <th scope="col" className="w-[18%] text-right">Predikat</th>
                        <th scope="col" className="w-[24%]">Catatan</th>
                      </>
                    }
                  >
                    {nilai.map((n) => (
                      <tr key={n.id} className="transition hover:bg-slate-50">
                        <td><Badge tone="slate">{n.tipe}</Badge></td>
                        <td className="text-slate-600">{n.semester}</td>
                        <td className="text-right font-semibold text-slate-800">{n.nilai}</td>
                        <td className="text-right">
                          <Badge tone={PRED_TONE[predikat(n.nilai)]}>{predikat(n.nilai)}</Badge>
                        </td>
                        <td className="truncate text-xs text-slate-500" title={n.catatan ?? undefined}>
                          {n.catatan ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </Card>
            </>
          )}

          {(kelasDiikuti.length > 0 || kelasDiajar.length > 0) && (
            <Card title="Kelas Saya">
              <div className="flex flex-wrap gap-2">
                {kelasDiajar.map((k) => (
                  <Badge key={`g-${k.id}`} tone="blue">
                    Mengampu {k.nama}
                  </Badge>
                ))}
                {kelasDiikuti.map((k) => (
                  <Badge key={`s-${k.id}`} tone="green">
                    Siswa {k.nama}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <Card title={`Jadwal Hari Ini (${HARI.includes(hariIni) ? hariIni : "-"})`}>
            {jadwalHariIni.length === 0 ? (
              <EmptyState message="Tidak ada jadwal hari ini." />
            ) : (
              <ul className="space-y-2">
                {jadwalHariIni.map((j) => (
                  <li
                    key={j.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{j.mapel.nama}</p>
                      <p className="text-xs text-slate-500">
                        {j.jamMulai} &ndash; {j.jamSelesai} • {j.kelas.nama} • R. {j.ruangan ?? "-"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <ActionForm action={updatePassword} title="Ubah Password">
            <Field
              label="Password Lama"
              name="passwordLama"
              type="password"
              required
              autoComplete="current-password"
            />
            <Field
              label="Password Baru"
              name="passwordBaru"
              type="password"
              required
              autoComplete="new-password"
              hint="Minimal 6 karakter."
            />
            <Field
              label="Ulangi Password Baru"
              name="passwordUlangi"
              type="password"
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-slate-400">
              Setelah diganti, gunakan password baru saat login berikutnya.
            </p>
          </ActionForm>

          <Card title={`Tentang ${BRAND.short}`}>
            <p className="text-sm leading-relaxed text-slate-600">
              {BRAND.description}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}