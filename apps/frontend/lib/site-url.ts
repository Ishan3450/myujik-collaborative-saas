/**
 * Canonical site URL for metadata, sitemap, and absolute links.
 * Prefer NEXTAUTH_URL in production, falls back to Vercel preview URL or localhost.
 */
 export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    try {
      return new URL(raw).origin;
    } catch {
      console.warn(`[site-url] Failed to parse URL "${raw}", trying next fallback`);
    }
  }
  return "http://localhost:3000";
 }
