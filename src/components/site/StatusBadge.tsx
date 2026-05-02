import type { IssueStatus } from "@/lib/types";

const labels: Record<IssueStatus, string> = {
  fixed: "Fixed",
  warning: "Warning",
  investigating: "Investigating",
};

const styles: Record<IssueStatus, string> = {
  fixed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  investigating: "bg-sky-50 text-sky-800 border border-sky-200",
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
