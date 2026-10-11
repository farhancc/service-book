import "server-only";
import { connection } from "next/server";
import { and, asc, eq, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db, schema } from "@/db";
import { STALE_AFTER_DAYS } from "./format";

const { attestations, countries, documentTypes, translations, services } = schema;

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Every word must match at least one of the columns: "india degree" finds India + Degree.
 * A word also matches on close spelling (trigram word-similarity), so "indea" still finds "India".
 */
function matchAllWords(q: string | undefined, columns: PgColumn[]): SQL | undefined {
  const words = (q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!words.length) return undefined;
  return and(
    ...words.map((w) =>
      or(...columns.map((c) => or(ilike(c, `%${escapeLike(w)}%`), sql`word_similarity(${w}, ${c}) >= 0.45`))),
    ),
  );
}

// ── Reference lists ────────────────────────────────────────────────────────────

export async function listCountries() {
  return db.select().from(countries).orderBy(asc(countries.name));
}

export async function listDocumentTypes() {
  return db.select().from(documentTypes).orderBy(asc(documentTypes.category), asc(documentTypes.name));
}

// ── Attestation ────────────────────────────────────────────────────────────────

const attestationRow = {
  id: attestations.id,
  variant: attestations.variant,
  code: attestations.code,
  priceAed: attestations.priceAed,
  governmentFeesAed: attestations.governmentFeesAed,
  turnaroundMinDays: attestations.turnaroundMinDays,
  turnaroundMaxDays: attestations.turnaroundMaxDays,
  available: attestations.available,
  lastVerifiedAt: attestations.lastVerifiedAt,
  stepCount: sql<number>`jsonb_array_length(${attestations.steps})`.mapWith(Number),
  country: countries.name,
  countryId: countries.id,
  documentType: documentTypes.name,
  documentTypeId: documentTypes.id,
};

export async function listAttestations(filters: { q?: string; countryId?: number; documentTypeId?: number }) {
  return db
    .select(attestationRow)
    .from(attestations)
    .innerJoin(countries, eq(countries.id, attestations.countryId))
    .innerJoin(documentTypes, eq(documentTypes.id, attestations.documentTypeId))
    .where(
      and(
        filters.countryId ? eq(attestations.countryId, filters.countryId) : undefined,
        filters.documentTypeId ? eq(attestations.documentTypeId, filters.documentTypeId) : undefined,
        matchAllWords(filters.q, [countries.name, documentTypes.name, attestations.variant, attestations.code]),
      ),
    )
    .orderBy(asc(countries.name), asc(documentTypes.name), asc(attestations.variant))
    .limit(200);
}

export async function getAttestation(id: number) {
  const rows = await db
    .select({ a: attestations, country: countries.name, documentType: documentTypes.name })
    .from(attestations)
    .innerJoin(countries, eq(countries.id, attestations.countryId))
    .innerJoin(documentTypes, eq(documentTypes.id, attestations.documentTypeId))
    .where(eq(attestations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ── Translation ────────────────────────────────────────────────────────────────

export async function listTranslations(filters: { q?: string; kind?: string }) {
  const kind = schema.translationKindEnum.enumValues.find((k) => k === filters.kind);
  return db
    .select({ t: translations, documentType: documentTypes.name })
    .from(translations)
    .leftJoin(documentTypes, eq(documentTypes.id, translations.documentTypeId))
    .where(
      and(
        kind ? eq(translations.kind, kind) : undefined,
        matchAllWords(filters.q, [
          translations.sourceLanguage,
          translations.targetLanguage,
          translations.code,
          documentTypes.name,
        ]),
      ),
    )
    .orderBy(asc(translations.sourceLanguage), asc(translations.targetLanguage), asc(documentTypes.name))
    .limit(300);
}

export async function getTranslation(id: number) {
  const rows = await db
    .select({ t: translations, documentType: documentTypes.name })
    .from(translations)
    .leftJoin(documentTypes, eq(documentTypes.id, translations.documentTypeId))
    .where(eq(translations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listLanguages() {
  const rows = await db.execute<{ lang: string }>(
    sql`select distinct lang from (
          select ${translations.sourceLanguage} as lang from ${translations}
          union select ${translations.targetLanguage} from ${translations}
        ) l order by lang`,
  );
  return rows.rows.map((r) => r.lang);
}

// ── Services ───────────────────────────────────────────────────────────────────

export async function listServices(filters: { q?: string; category?: string }) {
  const category = schema.serviceCategoryEnum.enumValues.find((c) => c === filters.category);
  return db
    .select()
    .from(services)
    .where(
      and(
        category ? eq(services.category, category) : undefined,
        matchAllWords(filters.q, [services.name, services.description, services.code]),
      ),
    )
    .orderBy(asc(services.category), asc(services.name))
    .limit(300);
}

export async function getService(id: number) {
  return (await db.query.services.findFirst({ where: eq(services.id, id) })) ?? null;
}

// ── Home ───────────────────────────────────────────────────────────────────────

export async function searchEverything(q: string) {
  const [a, t, s] = await Promise.all([
    listAttestations({ q }),
    listTranslations({ q }),
    listServices({ q }),
  ]);
  return { attestations: a.slice(0, 20), translations: t.slice(0, 20), services: s.slice(0, 20) };
}

/** Entries with no check date or one older than STALE_AFTER_DAYS. */
export async function needsVerification(now: Date) {
  const cutoff = new Date(now.getTime() - STALE_AFTER_DAYS * 86_400_000);
  const stale = (col: PgColumn) => or(isNull(col), lt(col, cutoff));

  const [a, t, s] = await Promise.all([
    db
      .select({
        id: attestations.id,
        lastVerifiedAt: attestations.lastVerifiedAt,
        label: sql<string>`${documentTypes.name} || ' — ' || ${countries.name}`,
      })
      .from(attestations)
      .innerJoin(countries, eq(countries.id, attestations.countryId))
      .innerJoin(documentTypes, eq(documentTypes.id, attestations.documentTypeId))
      .where(and(eq(attestations.available, true), stale(attestations.lastVerifiedAt)))
      .orderBy(asc(attestations.lastVerifiedAt))
      .limit(8),
    db
      .select({
        id: translations.id,
        lastVerifiedAt: translations.lastVerifiedAt,
        label: sql<string>`${translations.sourceLanguage} || ' → ' || ${translations.targetLanguage}`,
      })
      .from(translations)
      .where(and(eq(translations.available, true), stale(translations.lastVerifiedAt)))
      .orderBy(asc(translations.lastVerifiedAt))
      .limit(8),
    db
      .select({ id: services.id, lastVerifiedAt: services.lastVerifiedAt, label: services.name })
      .from(services)
      .where(and(eq(services.available, true), stale(services.lastVerifiedAt)))
      .orderBy(asc(services.lastVerifiedAt))
      .limit(8),
  ]);
  return [
    ...a.map((r) => ({ ...r, href: `/attestation/${r.id}`, kind: "Attestation" })),
    ...t.map((r) => ({ ...r, href: `/translation/${r.id}`, kind: "Translation" })),
    ...s.map((r) => ({ ...r, href: `/services/${r.id}`, kind: "Service" })),
  ];
}

export async function counts() {
  const [row] = await db
    .select({
      attestations: sql<number>`(select count(*) from ${attestations})`.mapWith(Number),
      translations: sql<number>`(select count(*) from ${translations})`.mapWith(Number),
      services: sql<number>`(select count(*) from ${services})`.mapWith(Number),
      countries: sql<number>`(select count(*) from ${countries})`.mapWith(Number),
    })
    .from(sql`(select 1) as one`);
  return row;
}

/** The current time, read at request time (after any prerendered shell). */
export async function requestNow() {
  await connection();
  return new Date();
}
