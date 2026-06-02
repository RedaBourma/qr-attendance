function resolveApiBase(): string {
  const raw =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    "http://localhost:8000/api";

  let base = raw.replace(/\/$/, "");

  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }

  return base;
}

export const API_BASE = resolveApiBase();

/** Student scan page — uses the browser origin so copied links match your running frontend. */
export function buildScanPageUrl(token: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (import.meta.env.VITE_FRONTEND_URL as string | undefined)?.replace(/\/$/, "") ||
        "http://localhost:3000";

  return `${origin}/scan/${token}`;
}
