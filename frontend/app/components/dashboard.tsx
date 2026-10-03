"use client";

import { useMemo, useState } from "react";

import { IssueFilters as FilterBar } from "./issue-filters";
import { IssueList } from "./issue-list";
import { StatCard } from "./stat-card";
import {
  DEFAULT_FILTERS,
  computeStats,
  filterIssues,
  sortIssues,
  type IssueFilters,
  type IssueSort,
} from "@/lib/issues";
import type { Issue } from "@/lib/types";

export interface DashboardProps {
  initialIssues: Issue[];
}

export function Dashboard({ initialIssues }: DashboardProps) {
  const [filters, setFilters] = useState<IssueFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<IssueSort>("newest");

  const visible = useMemo(
    () => sortIssues(filterIssues(initialIssues, filters), sort),
    [initialIssues, filters, sort],
  );

  // Stats describe what is currently on screen, so the tiles stay truthful
  // whenever the filters narrow the list.
  const stats = useMemo(() => computeStats(visible), [visible]);
  const total = useMemo(() => computeStats(initialIssues), [initialIssues]);

  return (
    <>
      <section
        id="dashboard"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-12 sm:px-6"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Live board
            </h2>
            <p className="mt-1 text-sm text-muted">
              Computed in the browser — the API has no aggregates endpoint.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Showing"
            value={stats.total}
            hint={`of ${total.total} tracked`}
            accent="indigo"
          />
          <StatCard label="Open" value={stats.open} accent="sky" />
          <StatCard label="In progress" value={stats.inProgress} accent="amber" />
          <StatCard label="Closed" value={stats.closed} accent="emerald" />
          <StatCard label="High priority" value={stats.high} accent="rose" />
          <StatCard
            label="Open rate"
            value={`${stats.openRate}%`}
            hint="open / showing"
          />
        </div>

        <FilterBar
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          resultCount={visible.length}
          totalCount={initialIssues.length}
        />

        <IssueList
          issues={visible}
          activePriority={filters.priority}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </section>
    </>
  );
}
