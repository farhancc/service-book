import type { ReactNode } from "react";
import type { CurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { formatAed, formatDate, formatTurnaround, freshness } from "@/lib/format";
import { TRACKED_FIELDS } from "@/lib/history";
import { FreshnessBadge, UnavailableBadge } from "./badges";
import { SubmitButton } from "./client";
import { ButtonLink, Section } from "./ui";

type Priced = {
  priceAed: string | null;
  costAed: string | null;
  governmentFeesAed: string | null;
  priceNote: string | null;
  turnaroundMinDays: number | null;
  turnaroundMaxDays: number | null;
  available: boolean;
  lastVerifiedAt: Date | null;
  internalNotes: string | null;
  clientNotes: string | null;
};

/** The headline numbers a salesperson quotes. */
export function PriceCard({
  item,
  now,
  user,
  unitLabel,
  extra,
}: {
  item: Priced;
  now: Date;
  user: CurrentUser | null;
  unitLabel?: string;
  extra?: ReactNode;
}) {
  const price = formatAed(item.priceAed);
  const cost = user ? formatAed(item.costAed) : null;
  const fees = formatAed(item.governmentFeesAed);
  const turnaround = formatTurnaround(item.turnaroundMinDays, item.turnaroundMaxDays);
  return (
    <section className="rounded-lg border-2 border-stamp bg-surface p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {item.available ? (
          <FreshnessBadge state={freshness(item.lastVerifiedAt, now)} date={item.lastVerifiedAt} />
        ) : (
          <UnavailableBadge />
        )}
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted">Our fee</dt>
          <dd className="text-3xl font-extrabold tracking-tight">
            {price ?? <span className="text-lg font-semibold text-muted">Not set</span>}
            {price && unitLabel && <span className="ml-1 text-base font-semibold text-muted">{unitLabel}</span>}
          </dd>
        </div>
        {fees && (
          <div>
            <dt className="text-sm text-muted">Government fees</dt>
            <dd className="text-xl font-bold">{fees}</dd>
          </div>
        )}
        {cost && (
          <div>
            <dt className="text-sm text-muted">Our cost</dt>
            <dd className="text-xl font-bold text-pending">{cost}</dd>
          </div>
        )}
        {turnaround && (
          <div>
            <dt className="text-sm text-muted">Turnaround</dt>
            <dd className="text-xl font-bold">{turnaround}</dd>
          </div>
        )}
        {extra}
      </dl>
      {item.priceNote && <p className="mt-3 text-sm text-ink">{item.priceNote}</p>}
      {user && item.internalNotes && (
        <div className="mt-4 rounded-md bg-pending-soft p-3 text-sm">
          <p className="font-semibold text-pending">Internal note</p>
          <p className="mt-0.5 whitespace-pre-line">{item.internalNotes}</p>
        </div>
      )}
    </section>
  );
}

export function EntryActions({
  user,
  editHref,
  markVerified,
  remove,
  deleteWhat,
}: {
  user: CurrentUser | null;
  editHref: string;
  markVerified: () => Promise<void>;
  remove: () => Promise<void>;
  deleteWhat: string;
}) {
  if (!user || !hasRole(user, "editor")) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <ButtonLink href={editHref}>Edit</ButtonLink>
      <form action={markVerified}>
        <SubmitButton variant="secondary" pendingText="Saving…">
          Price still correct
        </SubmitButton>
      </form>
      {hasRole(user, "admin") && (
        <form action={remove}>
          <SubmitButton
            variant="danger"
            pendingText="Deleting…"
            confirmText={`Delete ${deleteWhat}? This can't be undone.`}
          >
            Delete
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export function HistoryList({
  rows,
}: {
  rows: { id: number; field: string; oldValue: string | null; newValue: string | null; changedAt: Date; by: string | null }[];
}) {
  if (!rows.length) return null;
  const label = (f: string) => TRACKED_FIELDS[f as keyof typeof TRACKED_FIELDS] ?? f;
  const show = (field: string, v: string | null) => {
    if (v === null) return "—";
    if (field === "available") return v === "true" ? "Yes" : "No";
    if (field.endsWith("Aed")) return formatAed(v) ?? v;
    return v;
  };
  return (
    <Section title="Price history">
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <span>
              {label(r.field)}:{" "}
              {r.oldValue === null ? (
                <>set to </>
              ) : (
                <>
                  <span className="text-muted line-through">{show(r.field, r.oldValue)}</span>{" "}
                </>
              )}
              <span className="font-semibold">{show(r.field, r.newValue)}</span>
            </span>
            <span className="text-muted">
              {r.by ?? "Unknown"}, {formatDate(r.changedAt)}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      <ul className="space-y-2">
        {items.map((d, i) => (
          <li key={i} className="flex gap-2.5">
            <span aria-hidden className="mt-1 h-4 w-4 shrink-0 rounded-sm border-2 border-stamp" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function CheckedNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-4 rounded-md bg-verified-soft px-3 py-2 text-sm font-medium text-verified">
      Marked as checked today.
    </p>
  );
}
