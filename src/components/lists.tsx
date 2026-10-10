import Link from "next/link";
import type { Service, Translation } from "@/db/schema";
import {
  formatAed,
  formatTurnaround,
  freshness,
  PRICING_UNIT_LABELS,
  SERVICE_CATEGORY_LABELS,
  TRANSLATION_KIND_LABELS,
} from "@/lib/format";
import { FreshnessBadge, Tag, UnavailableBadge } from "./badges";

function Row({
  href,
  title,
  meta,
  price,
  badges,
}: {
  href: string;
  title: string;
  meta: string | null;
  price: string | null;
  badges: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-stamp-soft/40 focus-visible:bg-stamp-soft/40"
      >
        <div className="min-w-0">
          <p className="font-semibold text-ink">{title}</p>
          {meta && <p className="mt-0.5 text-sm text-muted">{meta}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">{badges}</div>
        </div>
        <p className="shrink-0 text-right font-bold text-ink">
          {price ?? <span className="text-sm font-normal text-muted">No price yet</span>}
        </p>
      </Link>
    </li>
  );
}

function ListFrame({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">{children}</ul>
  );
}

export type AttestationListItem = {
  id: number;
  variant: string;
  priceAed: string | null;
  turnaroundMinDays: number | null;
  turnaroundMaxDays: number | null;
  available: boolean;
  lastVerifiedAt: Date | null;
  stepCount: number;
  country: string;
  documentType: string;
};

export function AttestationList({ items, now }: { items: AttestationListItem[]; now: Date }) {
  return (
    <ListFrame>
      {items.map((a) => (
        <Row
          key={a.id}
          href={`/attestation/${a.id}`}
          title={`${a.documentType} — ${a.country}`}
          meta={[
            a.variant !== "Standard" ? a.variant : null,
            a.stepCount ? `${a.stepCount} step${a.stepCount === 1 ? "" : "s"}` : null,
            formatTurnaround(a.turnaroundMinDays, a.turnaroundMaxDays),
          ]
            .filter(Boolean)
            .join(", ")}
          price={formatAed(a.priceAed)}
          badges={
            a.available ? (
              <FreshnessBadge state={freshness(a.lastVerifiedAt, now)} date={a.lastVerifiedAt} />
            ) : (
              <UnavailableBadge />
            )
          }
        />
      ))}
    </ListFrame>
  );
}

export function TranslationList({
  items,
  now,
}: {
  items: { t: Translation; documentType: string | null }[];
  now: Date;
}) {
  return (
    <ListFrame>
      {items.map(({ t, documentType }) => {
        const price = formatAed(t.priceAed);
        return (
          <Row
            key={t.id}
            href={`/translation/${t.id}`}
            title={`${t.sourceLanguage} → ${t.targetLanguage}`}
            meta={[documentType ?? "Any document", formatTurnaround(t.turnaroundMinDays, t.turnaroundMaxDays)]
              .filter(Boolean)
              .join(", ")}
            price={price ? `${price} ${PRICING_UNIT_LABELS[t.pricingUnit]}` : null}
            badges={
              <>
                <Tag>{TRANSLATION_KIND_LABELS[t.kind]}</Tag>
                {t.available ? (
                  <FreshnessBadge state={freshness(t.lastVerifiedAt, now)} date={t.lastVerifiedAt} />
                ) : (
                  <UnavailableBadge />
                )}
              </>
            }
          />
        );
      })}
    </ListFrame>
  );
}

export function ServiceList({ items, now }: { items: Service[]; now: Date }) {
  return (
    <ListFrame>
      {items.map((s) => (
        <Row
          key={s.id}
          href={`/services/${s.id}`}
          title={s.name}
          meta={formatTurnaround(s.turnaroundMinDays, s.turnaroundMaxDays)}
          price={formatAed(s.priceAed)}
          badges={
            <>
              <Tag>{SERVICE_CATEGORY_LABELS[s.category]}</Tag>
              {s.available ? (
                <FreshnessBadge state={freshness(s.lastVerifiedAt, now)} date={s.lastVerifiedAt} />
              ) : (
                <UnavailableBadge />
              )}
            </>
          }
        />
      ))}
    </ListFrame>
  );
}
