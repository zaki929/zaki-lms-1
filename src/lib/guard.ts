import { notFound } from "next/navigation";
import type { Role } from "./prisma";

export function requireRole(actual: Role, allowed: Role[]) {
  if (!allowed.includes(actual)) notFound();
}
