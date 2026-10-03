"use client";

import { PriorityBadge } from "./priority-badge";
import { IssueEditor } from "./issue-editor";
import { StatusBadge } from "./status-badge";
import { shortId, type PriorityFilter } from "@/lib/issues";
import type { Issue } from "@/lib/types";

export interface IssueRowProps {
  issue: Issue;
  isEditing: boolean;
  activePriority: PriorityFilter;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (issue: Issue) => void;
  onError: (message: string) => void;
}

export function IssueRow({
  issue,
  isEditing,
  activePriority,
  onEdit,
  onCancelEdit,
  onSaved,
  onError,
}: IssueRowProps) {
  return (
    <li className="panel p-5 transition-colors hover:bg-raised/40">
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

      {isEditing ? (
        <IssueEditor
          issue={issue}
          onSaved={onSaved}
          onCancel={onCancelEdit}
          onError={onError}
        />
      ) : (
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
          >
            Edit
          </button>
        </div>
      )}
    </li>
  );
}
