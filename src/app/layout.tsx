import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: ["LMS", "sekolah", "e-learning", "Citra Negara Zaki", "manajemen sekolah"],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: `${BRAND.slogan} ${BRAND.description}`,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}