import type { ApiState } from "./components/api-status";
import { ApiUnavailable } from "./components/api-unavailable";
import { Dashboard } from "./components/dashboard";
import { Hero } from "./components/hero";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { fetchHealth, fetchIssues } from "@/lib/api";
import { computeStats } from "@/lib/issues";

export const metadata = {
  title: "IssueTrack",
  description:
    "Track, triage and report issues against the Issue Tracker API built with FastAPI.",
};

/**
 * Relative so it stays same-origin. `next.config.ts` proxies it to the backend,
 * which keeps the backend URL out of the rendered HTML.
 */
const DOCS_URL = "/docs";

export default async function Page() {
  // Fetched in parallel; neither call rejects, so one failure cannot block
  // the other. `cache: "no-store"` keeps the board live on every request.
  const [issuesResult, healthResult] = await Promise.all([
    fetchIssues(),
    fetchHealth(),
  ]);

  if (!issuesResult.ok) {
    return (
      <>
        <SiteHeader docsUrl={DOCS_URL} />
        <main className="flex-1">
          <ApiUnavailable
            error={issuesResult.error}
            showLocalHint={process.env.NODE_ENV === "development"}
          />
        </main>
        <SiteFooter docsUrl={DOCS_URL} />
      </>
    );
  }

  const issues = issuesResult.data;
  const apiState: ApiState = healthResult.ok ? "live" : "unreachable";

  return (
    <>
      <SiteHeader docsUrl={DOCS_URL} />
      <main className="flex-1">
        <Hero stats={computeStats(issues)} apiState={apiState} docsUrl={DOCS_URL} />
        <Dashboard initialIssues={issues} />
      </main>
      <SiteFooter docsUrl={DOCS_URL} />
    </>
  );
}
