"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DemoAccount = {
  email: string;
  name: string;
  role: string;
  password: string;
};

const inputNeu =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-inner outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200";

export default function LoginForm({ demo }: { demo: DemoAccount[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {/* Username / Email */}
        <div className="relative">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a7 7 0 0114 0v1" />
          </svg>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={inputNeu}
            placeholder="Username / Email"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={`${inputNeu} pr-11`}
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M6.7 6.7C4.6 8 3 10 2 12c1.5 3.5 5.2 6.5 10 6.5 1.7 0 3.3-.4 4.7-1m2.6-1.9c.9-.9 1.7-1.9 2.2-3.1-1.5-3.5-5.2-6.5-10-6.5-.6 0-1.2 0-1.8.1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12c1.5-3.5 5.2-6.5 10-6.5S20.5 8.5 22 12c-1.5 3.5-5.2 6.5-10 6.5S3.5 15.5 2 12z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Remember me + forgot password */}
        <div className="flex items-center justify-between px-1 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded accent-blue-700"
            />
            Remember Me
          </label>
          <a href="#" className="text-sm font-medium text-blue-700 transition hover:text-blue-900">
            Forgot Password?
          </a>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* Tombol login gradien biru */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-blue-700 to-blue-500 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-300/60 transition hover:from-blue-800 hover:to-blue-600 disabled:opacity-60"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? "Memproses..." : "Login"}
          </span>
        </button>
      </form>

      {/* Akun demo */}
      {demo.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Akun demo cepat
          </p>
          <div className="mt-3 grid gap-1.5">
            {demo.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  setError("");
                }}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {d.name} ({d.role})
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">{d.email}</span>
                </span>
                <span className="shrink-0 font-semibold text-blue-700">Pakai</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
