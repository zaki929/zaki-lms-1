// TextEncoder global (bukan dari "util") supaya aman di edge runtime middleware.
/**
 * Satu-satunya sumber SESSION_SECRET supaya lib/auth.ts dan middleware.ts
 * tidak bisa memakai fallback berbeda.
 */
export const sessionSecret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "citra-negara-zaki-lms-secret-change-in-production-123456"
);
