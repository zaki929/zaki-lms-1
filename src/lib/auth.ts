import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma, type Role } from "./prisma";
import { sessionSecret } from "./secret";

const secret = sessionSecret;

const COOKIE = "lms_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  nis?: string | null;
  nip?: string | null;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
      nis: (payload.nis as string) ?? null,
      nip: (payload.nip as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return null;
  // password disimpan sebagai bcrypt hash
  const { compare } = await import("bcryptjs");
  const ok = await compare(password, user.password);
  if (!ok) return null;
  return user;
}
