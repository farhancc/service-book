"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { money, pricingFields, requiredText, toFieldErrors, turnaroundError, type ActionState } from "@/lib/form";
import { deleteWithHistory, recordChanges } from "@/lib/history";

const TranslationInput = z.object({
  sourceLanguage: requiredText("From language"),
  targetLanguage: requiredText("To language"),
  documentTypeId: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().nullable(),
  ),
  kind: z.enum(schema.translationKindEnum.enumValues),
  pricingUnit: z.enum(schema.pricingUnitEnum.enumValues),
  minimumChargeAed: money,
  ...pricingFields,
});

export async function saveTranslation(
  existingId: number | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("editor");
  const parsed = TranslationInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  const { markVerified, ...input } = parsed.data;
  const bad = turnaroundError(input.turnaroundMinDays, input.turnaroundMaxDays);
  if (bad) return bad;

  const now = new Date();
  const values = { ...input, updatedById: user.id, updatedAt: now, ...(markVerified ? { lastVerifiedAt: now } : {}) };

  let savedId: number;
  if (existingId) {
    const before = await db.query.translations.findFirst({ where: eq(schema.translations.id, existingId) });
    if (!before) return { error: "This entry was deleted by someone else." };
    await db.update(schema.translations).set(values).where(eq(schema.translations.id, existingId));
    await recordChanges("translation", existingId, before, input, user.id);
    savedId = existingId;
  } else {
    const [row] = await db.insert(schema.translations).values(values).returning({ id: schema.translations.id });
    await recordChanges("translation", row.id, null, input, user.id);
    savedId = row.id;
  }
  redirect(`/translation/${savedId}`);
}

export async function markTranslationVerified(translationId: number) {
  const user = await requireRole("editor");
  await db
    .update(schema.translations)
    .set({ lastVerifiedAt: new Date(), updatedById: user.id })
    .where(eq(schema.translations.id, translationId));
  redirect(`/translation/${translationId}?checked=1`);
}

export async function deleteTranslation(translationId: number) {
  await requireRole("admin");
  await deleteWithHistory("translation", translationId, () =>
    db.delete(schema.translations).where(eq(schema.translations.id, translationId)),
  );
  redirect("/translation");
}
