import {
  type ApiError,
  type ApiErrorDetail,
  type ApiResult,
  type ApiValidationError,
  type Issue,
  type IssueCreate,
  type IssueUpdate,
} from "./types";

/**
 * Absolute URL of the FastAPI backend, used only for requests made from the
 * server (the `page.tsx` Server Component).
 *
 * This variable is deliberately NOT `NEXT_PUBLIC_`-prefixed. Next.js replaces
 * non-public `process.env` references with `undefined` inside the client
 * bundle, so the backend URL cannot leak to visitors through devtools. Requests
 * made from the browser go to same-origin relative paths instead and are
 * reverse-proxied by `next.config.ts`.
 *
 * There is no hardcoded fallback: a default would be inlined into the client
 * bundle, and silently defaulting would deploy a site that quietly points at the
 * wrong host. A missing value is reported as an error result instead.
 */
export const API_BASE_URL = (process.env.API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

/**
 * Generous, because the backend is on a free Render plan: a free instance spins
 * down when idle and needs roughly 10s (occasionally longer) to boot again, so
 * a short timeout would fail exactly when a user first arrives. When the wait
 * really is exceeded, the caller surfaces a retry affordance instead of hanging.
 */
const REQUEST_TIMEOUT_MS = 30000;

/** True while running on the Next.js server, false inside the browser. */
function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Builds the URL for a request.
 *
 * On the server the absolute backend URL is used. In the browser the path is
 * left relative so it hits our own origin and is proxied server-side.
 */
function resolveUrl(path: string): string {
  return isServer() ? `${API_BASE_URL}${path}` : path;
}

/**
 * Where a failed request was aimed, for the server log only.
 *
 * This must never reach an error message that gets rendered: `ApiUnavailable`
 * displays `error.message` in the HTML, which would publish the backend URL to
 * every visitor at the exact moment the API is down.
 */
function logServerFailure(message: string): void {
  if (isServer()) console.error(`[api] ${message} (API_BASE_URL: ${API_BASE_URL})`);
}

function isValidationErrorArray(
  detail: ApiErrorDetail,
): detail is ApiValidationError[] {
  return Array.isArray(detail);
}

function describeDetail(detail: ApiErrorDetail): string {
  if (typeof detail === "string") return detail;
  if (isValidationErrorArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join("; ");
  }
  return "The API returned an unexpected error.";
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail: ApiErrorDetail = "Request failed.";
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      detail = (body as { detail: ApiErrorDetail }).detail;
    }
  } catch {
    // A non-JSON body (or an empty 204) leaves the default detail in place.
  }
  return {
    status: response.status,
    detail,
    message: describeDetail(detail),
  };
}

/**
 * Network-level failures are turned into an ApiError rather than thrown, so a
 * stopped backend degrades the page instead of crashing the render.
 */
type RawResult =
  | { ok: true; response: Response }
  | { ok: false; error: ApiError };

/**
 * Performs the request and normalises transport and HTTP failures. The raw
 * Response is handed back to the caller so that endpoints which answer 204 with
 * no body are never asked to parse JSON.
 */
async function send(path: string, init: RequestInit = {}): Promise<RawResult> {
  // Fail with an actionable message rather than fetching a URL that is only
  // half-built, which would otherwise surface as a confusing network error.
  if (isServer() && !API_BASE_URL) {
    return {
      ok: false,
      error: {
        status: 0,
        detail: "The API base URL is not configured.",
        message:
          "API_BASE_URL is not set. Copy frontend/.env.example to frontend/.env.local and set it to the backend's absolute URL.",
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(resolveUrl(path), {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: await toApiError(response) };
    }

    return { ok: true, response };
  } catch (cause) {
    const aborted = cause instanceof Error && cause.name === "AbortError";
    const summary = aborted
      ? "The API request timed out."
      : "Could not reach the API.";
    logServerFailure(`${summary} path=${path} cause=${String(cause)}`);
    return {
      ok: false,
      error: {
        status: 0,
        detail: summary,
        message: aborted
          ? "The API did not respond in time. It may be starting up — try again in a moment."
          : "Could not reach the API. It may be starting up or temporarily unavailable — try again in a moment.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const raw = await send(path, init);
  if (!raw.ok) return raw;
  return { ok: true, data: (await raw.response.json()) as T };
}

/**
 * For endpoints that answer with an empty body. Calling `.json()` on a 204
 * would throw, and because the throw happens inside `send`, it would surface
 * as a bogus "could not reach the API" error.
 */
async function requestVoid(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<null>> {
  const raw = await send(path, init);
  return raw.ok ? { ok: true, data: null } : raw;
}

/**
 * GET /api/v1/issues
 *
 * Returns a bare array with no pagination or totals, so the dashboard derives
 * every statistic and filter from this single response. `cache: "no-store"`
 * keeps the dashboard live: the default Next.js behaviour is not to cache.
 */
export function fetchIssues(): Promise<ApiResult<Issue[]>> {
  return request<Issue[]>("/api/v1/issues", { cache: "no-store" });
}

/** GET /api/v1/health */
export async function fetchHealth(): Promise<ApiResult<{ status: string }>> {
  const result = await request<{ status: string }>("/api/v1/health", {
    cache: "no-store",
  });
  if (result.ok && result.data?.status !== "ok") {
    return {
      ok: false,
      error: {
        status: 200,
        detail: "The API reported an unhealthy status.",
        message: "The API responded but is not reporting a healthy status.",
      },
    };
  }
  return result;
}

/** POST /api/v1/issues — responds 201 with the created issue. */
export function createIssue(payload: IssueCreate): Promise<ApiResult<Issue>> {
  return request<Issue>("/api/v1/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/v1/issues/{id} — responds 200 with the updated issue.
 *
 * The backend applies a partial update: any field left out (or sent as null)
 * is left untouched, so only the changed keys need to be sent. Note there is
 * no PATCH route; PATCH would return 405.
 */
export function updateIssue(
  id: string,
  payload: IssueUpdate,
): Promise<ApiResult<Issue>> {
  return request<Issue>(`/api/v1/issues/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/v1/issues/{id} — responds 204 with no body, so it must not be
 * routed through `request`, which parses JSON.
 */
export function deleteIssue(id: string): Promise<ApiResult<null>> {
  return requestVoid(`/api/v1/issues/${id}`, { method: "DELETE" });
}

/**
 * Flattens a FastAPI 422 `detail` array into `{ field, message }` pairs so the
 * form can render errors next to the input that caused them.
 */
export function toFieldErrors(
  error: ApiError,
): { field: string; message: string }[] {
  if (!isValidationErrorArray(error.detail)) return [];
  return error.detail.map((item) => ({
    field: item.loc.filter((part) => part !== "body").join("."),
    message: item.msg,
  }));
}
