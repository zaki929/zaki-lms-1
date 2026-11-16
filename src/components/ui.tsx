import Link from "next/link";

export function Card({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "bg-indigo-500",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className={`h-11 w-1.5 shrink-0 rounded-full ${accent}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span
      className={`inline-flex max-w-full items-center truncate whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-indigo-600 hover:underline">
      &larr; {children}
    </Link>
  );
}

export function PageHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Tabel data responsif.
 *
 * `table-fixed` dipakai supaya `truncate` pada <td> benar-benar bekerja dan
 * kolom pertama tidak terpotong. Catatan: JANGAN memaksa `overflow-hidden` di
 * semua <td> — Badge memakai whitespace-nowrap sehingga akan terpotong di
 * tengah kata (mis. "HARIAN" -> "ARIAN"). Truncation cukup per-sel.
 */
export function DataTable({
  head,
  children,
  minWidth = 520,
  caption,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full table-fixed text-sm"
        style={{ minWidth }}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 [&>th]:whitespace-nowrap [&>th]:px-3 [&>th]:py-2.5 first:[&>th]:pl-0 last:[&>th]:pr-0">
            {head}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&>td]:px-3 [&>td]:py-2.5 first:[&>td]:pl-0 last:[&>td]:pr-0">
          {children}
        </tbody>
      </table>
    </div>
  );
}
