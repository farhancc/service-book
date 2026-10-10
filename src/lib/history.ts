import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { EntityType } from "@/db/schema";

/** Fields whose changes are kept in the price history. */
export const TRACKED_FIELDS = {
  priceAed: "Our fee",
  governmentFeesAed: "Government fees",
  minimumChargeAed: "Minimum charge",
  turnaroundMinDays: "Turnaround (min days)",
  turnaroundMaxDays: "Turnaround (max days)",
  available: "Available",
} as const;

type Tracked = Partial<Record<keyof typeof TRACKED_FIELDS, unknown>>;

function norm(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return String(Number(v));
  return String(v);
}

export async function recordChanges(
  entityType: EntityType,
  entityId: number,
  before: Tracked | null,
  after: Tracked,
  userId: number,
) {
  const rows = (Object.keys(TRACKED_FIELDS) as (keyof typeof TRACKED_FIELDS)[])
    .filter((field) => field in after)
    .map((field) => ({ field, oldValue: norm(before?.[field]), newValue: norm(after[field]) }))
    .filter((r) => r.oldValue !== r.newValue && !(before === null && r.newValue === null))
    .map((r) => ({ ...r, entityType, entityId, changedById: userId }));
  if (rows.length) await db.insert(schema.priceHistory).values(rows);
}

/** Deletes an entry and its price history together. */
export async function deleteWithHistory(
  entityType: EntityType,
  entityId: number,
  remove: () => Promise<unknown>,
) {
  await remove();
  await db
    .delete(schema.priceHistory)
    .where(and(eq(schema.priceHistory.entityType, entityType), eq(schema.priceHistory.entityId, entityId)));
}

export async function getHistory(entityType: EntityType, entityId: number) {
  return db
    .select({
      id: schema.priceHistory.id,
      field: schema.priceHistory.field,
      oldValue: schema.priceHistory.oldValue,
      newValue: schema.priceHistory.newValue,
      changedAt: schema.priceHistory.changedAt,
      by: schema.users.name,
    })
    .from(schema.priceHistory)
    .leftJoin(schema.users, eq(schema.users.id, schema.priceHistory.changedById))
    .where(
      and(eq(schema.priceHistory.entityType, entityType), eq(schema.priceHistory.entityId, entityId)),
    )
    .orderBy(desc(schema.priceHistory.changedAt))
    .limit(30);
}
