import type { IssueStatus } from "@/lib/types";

const labels: Record<IssueStatus, string> = {
  fixed: "Fixed",
  warning: "Warning",
  investigating: "Investigating",
};

const styles: Record<IssueStatus, string> = {
  fixed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  investigating:
    "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
