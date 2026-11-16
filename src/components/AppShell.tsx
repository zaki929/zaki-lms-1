"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { BRAND } from "@/lib/brand";
import { ROLE_LABEL } from "@/lib/prisma";
import { SchoolLogo } from "@/components/SchoolLogo";
import { ToastHost } from "@/components/toast";

const ICONS: Record<string, string> = {
  LayoutDashboard: "M3 12l9-8 9 8M5 10v10h14V10",
  ClipboardList: "M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5",
  GraduationCap: "M12 4l10 5-10 5L2 9zM6 11v5c0 1 3 2 6 2s6-1 6-2v-5",
  CalendarCheck: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4m-4 4l2 2 4-4",
  CalendarDays: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  School: "M12 4L2 9l10 5 10-5zM6 11v5c0 1 3 3 6 3s6-2 6-3v-5",
  BookOpen: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM19 19H6",
  Users: "M16 19v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8M22 19v-2a4 4 0 00-3-3.8",
  BarChart3: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  Megaphone: "M3 11v3a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM17 8a5 5 0 010 8",
  UserCircle: "M12 11a4 4 0 100-8 4 4 0 000 8M6 21v-1a6 6 0 0112 0v1",
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      {(ICONS[name] ?? "").split("M").filter(Boolean).map((d, i) => (
        <path key={i} d={`M${d}`} />
      ))}
    </svg>
  );
}

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navFor(user.role);

  // Tutup drawer saat pindah halaman (mis. lewat tombol back di browser).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll body + tutup dengan Escape selama drawer terbuka.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = user.name
    .replace(/[^A-Za-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
        <SchoolLogo size={32} />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">{BRAND.short}</p>
          <p className="truncate text-[11px] text-slate-400">Sekolah Digital Platform</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Menu utama">
        {items.map((i) => {
          const active = pathname === i.href || pathname.startsWith(i.href + "/");
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-indigo-600 font-medium text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon name={i.icon} />
              <span className="truncate">{i.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {initials || user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-3">
          <button className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">
            Keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 h-full w-full bg-slate-900/60"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[85vw] shadow-2xl">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">{sidebar}</div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <button
            className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <p className="hidden min-w-0 truncate text-sm text-slate-500 lg:block">
            Login sebagai{" "}
            <span className="font-semibold text-slate-700">{ROLE_LABEL[user.role]}</span>
          </p>
          <p className="text-sm font-semibold text-slate-800 lg:hidden">{BRAND.short}</p>
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="max-w-[14rem] truncate text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {initials || user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <ToastHost />
    </div>
  );
}
