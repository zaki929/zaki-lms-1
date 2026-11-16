/**
 * Satu sumber kebenaran untuk penilaian.
 *
 * Sebelumnya dashboard memakai 80/70/60 sementara halaman nilai memakai
 * 85/75/65 — siswa yang sama bisa melihat predikat berbeda di dua halaman.
 */

export type Predikat = "A" | "B" | "C" | "D";

export function predikat(n: number): Predikat {
  if (n >= 85) return "A";
  if (n >= 75) return "B";
  if (n >= 65) return "C";
  return "D";
}

export const PRED_TONE: Record<Predikat, "green" | "blue" | "amber" | "red"> = {
  A: "green",
  B: "blue",
  C: "amber",
  D: "red",
};

export const TIPE_NILAI = ["HARIAN", "TUGAS", "UTS", "UAS"] as const;
