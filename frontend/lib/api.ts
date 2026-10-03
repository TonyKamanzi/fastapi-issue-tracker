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
 * The backend runs on port 8000 by default (`fastapi dev main.py`).
 * The env var is optional: `.env.local` is gitignored, so the fallback keeps
 * the app working on a fresh clone with no configuration.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 8000;

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
async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: await toApiError(response) };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch (cause) {
    const aborted = cause instanceof Error && cause.name === "AbortError";
    return {
      ok: false,
      error: {
        status: 0,
        detail: aborted ? "The API request timed out." : "Could not reach the API.",
        message: aborted
          ? `The API at ${API_BASE_URL} did not respond in time.`
          : `Could not reach the API at ${API_BASE_URL}. Is the backend running?`,
      },
    };
  } finally {
    clearTimeout(timer);
  }
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
