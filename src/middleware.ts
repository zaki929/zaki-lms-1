import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { sessionSecret } from "@/lib/secret";

const secret = sessionSecret;

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("lms_session")?.value;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/";

  // Tidak ada token
  if (!token) {
    if (isPublic) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  try {
    // Cek token
    await jwtVerify(token, secret);

    // Kalau sudah login dan membuka /login,
    // arahkan ke dashboard
    if (pathname === "/login") {
      return NextResponse.redirect(
        new URL("/dashboard", req.url)
      );
    }

    return NextResponse.next();
  } catch {
    // TOKEN INVALID / EXPIRED
    if (pathname.startsWith("/api")) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );

      response.cookies.delete("lms_session");

      return response;
    }

    // Hapus cookie yang rusak
    const response = NextResponse.redirect(
      new URL("/login", req.url)
    );

    response.cookies.delete("lms_session");

    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};