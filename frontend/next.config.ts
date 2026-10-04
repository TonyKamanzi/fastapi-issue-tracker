import type { NextConfig } from "next";

/**
 * Absolute URL of the FastAPI backend, read from a server-only variable.
 *
 * `process.env.API_BASE_URL` is replaced with `undefined` inside the client
 * bundle by Next.js, because only `NEXT_PUBLIC_`-prefixed variables are inlined
 * for the browser. Referencing it here therefore keeps the backend URL out of
 * anything the browser downloads.
 */
function apiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

/**
 * Reverse-proxies the API so the browser only ever talks to its own origin.
 *
 * Client components fetch same-origin relative paths (`/api/v1/issues`), which
 * Next.js forwards to the backend here on the server. That keeps the backend
 * URL out of the HTML and the JavaScript bundle, and it makes the request
 * same-origin so the backend's CORS policy is never exercised at all.
 *
 * `/docs` and `/openapi.json` are proxied for the same reason: the header,
 * hero and footer render the API docs link, and pointing that at the backend
 * would put the backend URL straight back into the page.
 *
 * `rewrites()` runs at build time, so `API_BASE_URL` must be set in the build
 * environment (locally via `.env.local`, on Vercel via project environment
 * variables). Failing loudly here is deliberate: a silently empty rewrite list
 * would deploy a site that cannot reach its own backend.
 */
function proxyRewrites(): { source: string; destination: string }[] {
  const base = apiBaseUrl();

  if (!base) {
    throw new Error(
      "API_BASE_URL is not set. Copy frontend/.env.example to frontend/.env.local " +
        "and set it to the backend's absolute URL.",
    );
  }

  const proxied: { source: string; destination: string }[] = [
    { source: "/api/v1/:path*", destination: `${base}/api/v1/:path*` },
    { source: "/docs", destination: `${base}/docs` },
    { source: "/openapi.json", destination: `${base}/openapi.json` },
  ];

  return proxied;
}

const nextConfig: NextConfig = {
  async rewrites() {
    return proxyRewrites();
  },
};

export default nextConfig;
