/** Prices older than this many days are flagged for re-checking. */
export const STALE_AFTER_DAYS = 90;

export const DOCUMENT_CATEGORY_LABELS = {
  educational: "Educational",
  personal: "Personal",
  commercial: "Commercial",
  legal: "Legal",
  other: "Other",
} as const;

export const TRANSLATION_KIND_LABELS = {
  legal: "Legal (MOJ certified)",
  certified: "Certified",
  general: "General",
} as const;

export const PRICING_UNIT_LABELS = {
  page: "per page",
  word: "per word",
  document: "per document",
} as const;

export const SERVICE_CATEGORY_LABELS = {
  business_setup: "Business setup",
  pro: "PRO services",
  visa: "Visas",
  other: "Other",
} as const;

export const ROLE_LABELS = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
} as const;

const aed = new Intl.NumberFormat("en-AE", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "AED 1,250" or null when no price is set. */
export function formatAed(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return `AED ${aed.format(n)}`;
}

export function formatTurnaround(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} working days`;
  const d = (min ?? max)!;
  return `${d} working day${d === 1 ? "" : "s"}`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dubai",
});

export function formatDate(d: Date | null | undefined): string {
  return d ? dateFmt.format(d) : "Never";
}

export type Freshness = "verified" | "stale" | "unverified";

/** Call only at request time (it reads the clock). */
export function freshness(lastVerifiedAt: Date | null, now: Date): Freshness {
  if (!lastVerifiedAt) return "unverified";
  const ageDays = (now.getTime() - lastVerifiedAt.getTime()) / 86_400_000;
  return ageDays > STALE_AFTER_DAYS ? "stale" : "verified";
}
