
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Role = "ADMIN" | "GURU" | "SISWA" | "KEPSEK" | "KURIKULUM";

export const ROLES: Role[] = ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  GURU: "Guru",
  SISWA: "Siswa",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
};
