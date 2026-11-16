import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyCredentials } from "@/lib/auth";
import type { Role } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const user = await verifyCredentials(
    parsed.data.email.toLowerCase().trim(),
    parsed.data.password
  );

  if (!user) {
    return NextResponse.json(
      { error: "Email atau password salah" },
      { status: 401 }
    );
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    nis: user.nis,
    nip: user.nip,
  });

  return NextResponse.json({ ok: true, role: user.role });
}
