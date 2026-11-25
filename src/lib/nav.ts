import type { Role } from "@/lib/prisma";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
  { href: "/tugas", label: "Tugas & Pengumpulan", icon: "ClipboardList", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
  { href: "/nilai", label: "Penilaian", icon: "GraduationCap", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
  { href: "/absensi", label: "Absensi", icon: "CalendarCheck", roles: ["ADMIN", "KEPSEK", "KURIKULUM"] },
  { href: "/jadwal", label: "Jadwal Mengajar", icon: "CalendarDays", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
  { href: "/kelas", label: "Data Kelas", icon: "School", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
  { href: "/mapel", label: "Mata Pelajaran", icon: "BookOpen", roles: ["ADMIN", "GURU", "KEPSEK", "KURIKULUM"] },
  { href: "/pengguna", label: "Manajemen Pengguna", icon: "Users", roles: ["ADMIN", "KEPSEK"] },
  { href: "/kurikulum", label: "Manajemen Kurikulum", icon: "Library", roles: ["ADMIN", "KEPSEK", "KURIKULUM"] },
  { href: "/tahun-ajaran", label: "Tahun Ajaran", icon: "CalendarDays", roles: ["ADMIN", "KEPSEK"] },
  { href: "/laporan", label: "Laporan & Statistik", icon: "BarChart3", roles: ["ADMIN", "KEPSEK", "KURIKULUM"] },
  { href: "/pengumuman", label: "Pengumuman", icon: "Megaphone", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
  { href: "/profil", label: "Profil Saya", icon: "UserCircle", roles: ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] },
];

export function navFor(role: Role) {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}
