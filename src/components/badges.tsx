import { formatDate, type Freshness } from "@/lib/format";
import { cx } from "./ui";

export function FreshnessBadge({ state, date }: { state: Freshness; date: Date | null }) {
  const styles: Record<Freshness, string> = {
    verified: "bg-verified-soft text-verified",
    stale: "bg-seal-soft text-seal",
    unverified: "bg-pending-soft text-pending",
  };
  const text: Record<Freshness, string> = {
    verified: `Checked ${formatDate(date)}`,
    stale: `Re-check price (last checked ${formatDate(date)})`,
    unverified: "Price not checked yet",
  };
  return (
    <span className={cx("inline-flex rounded px-2 py-0.5 text-xs font-semibold", styles[state])}>
      {text[state]}
    </span>
  );
}

export function UnavailableBadge() {
  return (
    <span className="inline-flex rounded bg-ink px-2 py-0.5 text-xs font-semibold text-white">
      We don&apos;t offer this
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded border border-line px-2 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}
