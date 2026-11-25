"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";
import { gradePengumpulan, updateNilai, updateJadwal, updateKelas, updateMapel, updatePengumuman, updateTahunAjaran, setTahunAjaranAktif } from "@/app/actions";
import { toastFromState } from "@/components/toast";

type Action = (formData: FormData) => Promise<ActionState | void> | ActionState | void;

export function SubmitButton({ label = "Simpan" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner />}
      {pending ? "Memproses..." : label}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.4" fill="none" opacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function DeleteButton({
  label = "Hapus",
  tone = "danger",
  disabled,
}: {
  label?: string;
  tone?: "danger" | "neutral";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const style =
    tone === "danger"
      ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100";
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
    >
      {pending ? "..." : label}
    </button>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";

/** id unik per field supaya <label htmlFor> selalu menunjuk ke input yang benar. */
let uid = 0;
function fieldId(name: string) {
  uid += 1;
  return `f-${name}-${uid}`;
}

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  options,
  hint,
  min,
  max,
  step,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  options?: { value: string; label: string }[];
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
}) {
  const id = fieldId(name);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {options ? (
        <select
          id={id}
          name={name}
          required={required}
          defaultValue={defaultValue}
          className={inputCls}
        >
          <option value="">-- pilih --</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          className={inputCls}
        />
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  required,
  rows = 3,
  placeholder,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
}) {
  const id = fieldId(name);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span aria-hidden="true" className="text-red-500">
            {" "}*
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export function MultiSelect({
  label,
  name,
  options,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  hint?: string;
  defaultValue?: string[];
}) {
  const id = fieldId(name);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        name={name}
        multiple
        defaultValue={defaultValue}
        size={Math.min(6, Math.max(3, options.length))}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-400">
        {hint ?? "Tahan Ctrl/Cmd (atau Shift) untuk pilih lebih dari satu."}
      </p>
    </div>
  );
}

const wrap = "flex flex-col gap-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4";

/**
 * Menjalankan server action dan memantulkan hasilnya ke toast global.
 * useActionState tetap dipakai supaya error tetap tampil di dalam form
 * (user tidak boleh scouring layar untuk tahu ada yang gagal).
 */
function useFormAction(action: Action) {
  return useActionState<ActionState, FormData>(
    async (_prev, fd) => {
      let next: ActionState;
      try {
        next = (await action(fd)) ?? undefined;
      } catch (e) {
        next = { error: e instanceof Error ? e.message : "Terjadi kesalahan." };
      }
      toastFromState(next);
      return next;
    },
    undefined
  );
}

export function ActionForm({
  action,
  children,
  title,
}: {
  action: Action;
  children: React.ReactNode;
  title?: string;
}) {
  const [state, formAction] = useFormAction(action);

  return (
    <form action={formAction} className={wrap} noValidate={false}>
      {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}
      {state?.success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {state.success}
        </p>
      )}
      {children}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}

/**
 * Form nilai cepat per pengumpulan tugas.
 *
 * Memakai useActionAction yang sama dengan form lain supaya pesan error / toast
 * tetap muncul, dan state tetap konsisten setelah revalidatePath.
 */
export function GradeForm({
  id,
  defaultNilai,
  defaultCatatan,
}: {
  id: string;
  defaultNilai?: number | null;
  defaultCatatan?: string | null;
}) {
  const [state, formAction] = useFormAction(gradePengumpulan);
  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="w-24">
        <label
          htmlFor={`nilai-${id}`}
          className="block text-[11px] font-medium text-slate-500"
        >
          Nilai (0-100)
        </label>
        <input
          id={`nilai-${id}`}
          name="nilaiAkhir"
          type="number"
          min={0}
          max={100}
          step={0.1}
          defaultValue={defaultNilai ?? ""}
          placeholder="-"
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="min-w-[8rem] flex-1">
        <label
          htmlFor={`catatan-${id}`}
          className="block text-[11px] font-medium text-slate-500"
        >
          Catatan
        </label>
        <input
          id={`catatan-${id}`}
          name="catatan"
          defaultValue={defaultCatatan ?? ""}
          placeholder="Catatan untuk siswa"
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <button
        type="submit"
        className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
      >
        Simpan
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

/**
 * Form koreksi nilai yang sudah ada.
 *
 * Tombol "Ubah" membuka panel inline (bukan window.confirm) supaya nilai lama
 * tetap terlihat sebagai pembanding saat mengetik nilai yang benar.
 */
export function EditNilaiForm({
  id,
  defaultNilai,
  defaultCatatan,
}: {
  id: string;
  defaultNilai: number;
  defaultCatatan?: string | null;
}) {
  const [state, formAction] = useFormAction(updateNilai);
  const [buka, setBuka] = useState(false);
  const [nilai, setNilai] = useState(String(defaultNilai));

  // Tutup panel otomatis setelah server action sukses. dispatcher dari
  // useActionState tidak mengembalikan nilai, jadi sukses dideteksi lewat
  // perubahan `state` (useFormAction sudah memantulkan state yang sama ke toast).
  useEffect(() => {
    if (buka && state?.success) {
      setBuka(false);
      setNilai(String(defaultNilai));
    }
  }, [buka, state?.success, defaultNilai]);

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Ubah
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="w-20">
        <label htmlFor={`edit-nilai-${id}`} className="block text-[11px] font-medium text-slate-500">
          Nilai
        </label>
        <input
          id={`edit-nilai-${id}`}
          name="nilai"
          type="number"
          min={0}
          max={100}
          step={0.1}
          required
          value={nilai}
          onChange={(e) => setNilai(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="min-w-[7rem] flex-1">
        <label htmlFor={`edit-catatan-${id}`} className="block text-[11px] font-medium text-slate-500">
          Catatan
        </label>
        <input
          id={`edit-catatan-${id}`}
          name="catatan"
          defaultValue={defaultCatatan ?? ""}
          placeholder="Catatan siswa"
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
      >
        Simpan
      </button>
      <button
        type="button"
        onClick={() => setBuka(false)}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Batal
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export function DeleteForm({
  action,
  id,
  label,
  confirm,
  disabled,
}: {
  action: Action;
  id: string;
  label?: string;
  /** Kalimat konfirmasi. Kosongkan hanya untuk aksi yang sangat jelas. */
  confirm?: string;
  disabled?: boolean;
}) {
  const [, formAction] = useFormAction(action);
  return (
    <form
      action={formAction}
      className="inline-flex"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {/* Hasilnya dilaporkan lewat toast: pesan error yang panjang di dalam
          <td> justru merusak layout tabel. */}
      <DeleteButton label={label} disabled={disabled} />
    </form>
  );
}
/**
 * Form edit inline generik untuk data sederhana.
 * Dipakai oleh Kelas, Mapel, Jadwal, Pengumuman.
 */
export function EditPengumumanForm({
  pengumuman,
}: {
  pengumuman: { id: string; judul: string; isi: string; target: string };
}) {
  const [state, formAction] = useFormAction(updatePengumuman);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (buka && state?.success) setBuka(false);
  }, [buka, state?.success]);

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Ubah
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Pengumuman</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={pengumuman.id} />
          <Field label="Judul" name="judul" required defaultValue={pengumuman.judul} />
          <TextArea label="Isi Pengumuman" name="isi" required rows={4} defaultValue={pengumuman.isi} />
          <Field
            label="Ditujukan Untuk"
            name="target"
            required
            defaultValue={pengumuman.target}
            options={[
              { value: "SEMUA", label: "Semua User" },
              { value: "GURU", label: "Guru" },
              { value: "SISWA", label: "Siswa" },
              { value: "KEPSEK", label: "Kepala Sekolah" },
              { value: "KURIKULUM", label: "Kurikulum" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBuka(false)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Batal</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Simpan</button>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}

export function EditJadwalForm({
  jadwal,
  allKelas,
  allMapel,
}: {
  jadwal: { id: string; hari: string; jamMulai: string; jamSelesai: string; ruangan?: string | null; kelasId: string; mapelId: string };
  allKelas: { id: string; nama: string }[];
  allMapel: { id: string; nama: string }[];
}) {
  const [state, formAction] = useFormAction(updateJadwal);
  const [buka, setBuka] = useState(false);
  const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  useEffect(() => {
    if (buka && state?.success) setBuka(false);
  }, [buka, state?.success]);

  if (!buka) {
    return (
      <button type="button" onClick={() => setBuka(true)} className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
        Ubah
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Jadwal</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={jadwal.id} />
          <Field label="Hari" name="hari" required defaultValue={jadwal.hari} options={HARI.map((h) => ({ value: h, label: h }))} />
          <Field label="Jam Mulai" name="jamMulai" type="time" required defaultValue={jadwal.jamMulai} />
          <Field label="Jam Selesai" name="jamSelesai" type="time" required defaultValue={jadwal.jamSelesai} />
          <Field label="Ruangan" name="ruangan" defaultValue={jadwal.ruangan ?? ""} />
          <Field label="Kelas" name="kelasId" required defaultValue={jadwal.kelasId} options={allKelas.map((k) => ({ value: k.id, label: k.nama }))} />
          <Field label="Mata Pelajaran" name="mapelId" required defaultValue={jadwal.mapelId} options={allMapel.map((m) => ({ value: m.id, label: m.nama }))} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBuka(false)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Batal</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Simpan</button>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}

export function EditMapelForm({
  mapel,
  allKelas,
}: {
  mapel: { id: string; nama: string; kode: string; deskripsi?: string | null; kelas: { id: string }[] };
  allKelas: { id: string; nama: string }[];
}) {
  const [state, formAction] = useFormAction(updateMapel);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (buka && state?.success) setBuka(false);
  }, [buka, state?.success]);

  if (!buka) {
    return (
      <button type="button" onClick={() => setBuka(true)} className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
        Ubah
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Mata Pelajaran</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={mapel.id} />
          <Field label="Nama Mapel" name="nama" required defaultValue={mapel.nama} />
          <Field label="Kode" name="kode" required defaultValue={mapel.kode} hint="Kode unik, otomatis jadi huruf besar." />
          <TextArea label="Deskripsi" name="deskripsi" defaultValue={mapel.deskripsi ?? ""} />
          <MultiSelect label="Kelas" name="kelasId" options={allKelas.map((k) => ({ value: k.id, label: k.nama }))} defaultValue={mapel.kelas.map((k) => k.id)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBuka(false)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Batal</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Simpan</button>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}

export function EditKelasForm({
  kelas,
  allGuru,
  allSiswa,
}: {
  kelas: { id: string; nama: string; tingkat: string; tahun: string; wali?: string | null; guruId?: string | null; siswa: { id: string }[] };
  allGuru: { id: string; name: string }[];
  allSiswa: { id: string; name: string; nis: string | null }[];
}) {
  const [state, formAction] = useFormAction(updateKelas);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (buka && state?.success) setBuka(false);
  }, [buka, state?.success]);

  if (!buka) {
    return (
      <button type="button" onClick={() => setBuka(true)} className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
        Ubah
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Kelas</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={kelas.id} />
          <Field label="Nama Kelas" name="nama" required defaultValue={kelas.nama} />
          <Field label="Tingkat" name="tingkat" required defaultValue={kelas.tingkat} options={["X", "XI", "XII"].map((t) => ({ value: t, label: t }))} />
          <Field label="Tahun Ajaran" name="tahun" required defaultValue={kelas.tahun} />
          <Field label="Wali Kelas" name="wali" defaultValue={kelas.wali ?? ""} />
          <Field label="Guru Pengampu" name="guruId" defaultValue={kelas.guruId ?? ""} options={allGuru.map((g) => ({ value: g.id, label: g.name }))} />
          <MultiSelect label="Anggota Siswa" name="siswaId" options={allSiswa.map((s) => ({ value: s.id, label: `${s.name} (${s.nis ?? "-"})` }))} defaultValue={kelas.siswa.map((s) => s.id)} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBuka(false)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Batal</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Simpan</button>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}

/**
 * Form edit modal untuk satu tahun ajaran.
 */
export function EditTahunAjaranForm({
  tahun,
}: {
  tahun: { id: string; nama: string; semester: number };
}) {
  const [state, formAction] = useFormAction(updateTahunAjaran);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (buka && state?.success) setBuka(false);
  }, [buka, state?.success]);

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Ubah
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">Ubah Tahun Ajaran</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={tahun.id} />
          <Field label="Nama Tahun Ajaran" name="nama" required defaultValue={tahun.nama} />
          <Field
            label="Semester"
            name="semester"
            type="number"
            required
            defaultValue={tahun.semester}
            min={1}
            max={2}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBuka(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}

/**
 * Tombol untuk menetapkan satu tahun ajaran sebagai aktif.
 * Menggunakan useFormAction supaya pesan error/success tetap muncul via toast.
 */
export function TombolSetAktif({ tahun }: { tahun: { id: string; nama: string; aktif: boolean } }) {
  const [, formAction] = useFormAction(setTahunAjaranAktif);
  if (tahun.aktif) return null;
  return (
    <form
      action={formAction}
      className="inline-flex"
      onSubmit={(e) => {
        if (!window.confirm(`Set "${tahun.nama}" sebagai tahun ajaran aktif?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={tahun.id} />
      <button
        type="submit"
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Set Aktif
      </button>
    </form>
  );
}

