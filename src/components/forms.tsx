"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";
import { gradePengumpulan, updateNilai } from "@/app/actions";
import { toastFromState } from "@/components/toast";

type Action = (formData: FormData) => Promise<ActionState | void> | ActionState | void;

export function SubmitButton({ label = "Simpan" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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

export function DeleteButton({ label = "Hapus", tone = "danger" }: { label?: string; tone?: "danger" | "neutral" }) {
  const { pending } = useFormStatus();
  const style =
    tone === "danger"
      ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
    >
      {pending ? "..." : label}
    </button>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400";

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
          <span className="ml-0.5 text-rose-500" aria-hidden="true">
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
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = fieldId(name);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function MultiSelect({
  label,
  name,
  options,
  hint,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  hint?: string;
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
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
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
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <button
        type="submit"
        className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
      >
        Simpan
      </button>
      {state?.error && <span className="text-xs text-rose-600">{state.error}</span>}
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
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
          className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-700"
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
      {state?.error && <span className="text-xs text-rose-600">{state.error}</span>}
    </form>
  );
}

export function DeleteForm({
  action,
  id,
  label,
  confirm,
}: {
  action: Action;
  id: string;
  label?: string;
  /** Kalimat konfirmasi. Kosongkan hanya untuk aksi yang sangat jelas. */
  confirm?: string;
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
      <DeleteButton label={label} />
    </form>
  );
}
