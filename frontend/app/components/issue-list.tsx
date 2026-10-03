import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { shortId, type PriorityFilter } from "@/lib/issues";
import type { Issue } from "@/lib/types";

export interface IssueListProps {
  issues: Issue[];
  activePriority: PriorityFilter;
  onClear: () => void;
}

export function IssueList({ issues, activePriority, onClear }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="panel mt-4 px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">No issues match</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Adjust the search or filters to see more results.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {issues.map((issue) => (
        <li key={issue.id} className="panel p-5 transition-colors hover:bg-raised/40">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-medium break-words text-ink">
                {issue.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed break-words text-muted">
                {issue.description}
              </p>
              <p className="mt-3 font-mono text-xs text-faint" title={issue.id}>
                #{shortId(issue.id)}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge
                priority={issue.priority}
                active={activePriority === issue.priority}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
