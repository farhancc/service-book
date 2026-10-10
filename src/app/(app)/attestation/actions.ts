"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import {
  isUniqueViolation,
  lines,
  pricingFields,
  toFieldErrors,
  turnaroundError,
  type ActionState,
} from "@/lib/form";
import { deleteWithHistory, recordChanges } from "@/lib/history";

const step = z.object({
  title: z.string().trim().min(1, "Every step needs a name").max(200),
  authority: z.string().trim().max(200).optional(),
  where: z.string().trim().max(200).optional(),
  days: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const stepsJson = z.preprocess((v) => {
  try {
    return JSON.parse(String(v ?? "[]"));
  } catch {
    return null;
  }
}, z.array(step).max(30, "Keep it to 30 steps or fewer"));

const AttestationInput = z.object({
  countryId: z.coerce.number().int().positive("Pick a country"),
  documentTypeId: z.coerce.number().int().positive("Pick a document type"),
  variant: z.preprocess((v) => (typeof v === "string" && v.trim()) || "Standard", z.string().max(100)),
  steps: stepsJson,
  requiredDocuments: lines,
  ...pricingFields,
});

export async function saveAttestation(
  existingId: number | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("editor");
  const parsed = AttestationInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  const { markVerified, ...input } = parsed.data;
  const bad = turnaroundError(input.turnaroundMinDays, input.turnaroundMaxDays);
  if (bad) return bad;

  // Drop empty optional step fields so the stored JSON stays tidy.
  const steps = input.steps.map((s) =>
    Object.fromEntries(Object.entries(s).filter(([, v]) => v !== "" && v !== undefined)),
  ) as schema.AttestationStep[];

  const now = new Date();
  const values = {
    ...input,
    steps,
    updatedById: user.id,
    updatedAt: now,
    ...(markVerified ? { lastVerifiedAt: now } : {}),
  };

  let savedId: number;
  try {
    if (existingId) {
      const before = await db.query.attestations.findFirst({ where: eq(schema.attestations.id, existingId) });
      if (!before) return { error: "This entry was deleted by someone else." };
      await db.update(schema.attestations).set(values).where(eq(schema.attestations.id, existingId));
      await recordChanges("attestation", existingId, before, input, user.id);
      savedId = existingId;
    } else {
      const [row] = await db
        .insert(schema.attestations)
        .values(values)
        .returning({ id: schema.attestations.id });
      await recordChanges("attestation", row.id, null, input, user.id);
      savedId = row.id;
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        error: "This country and document already has an entry with that variant.",
        fieldErrors: { variant: "Use a different variant name, like Urgent or Apostille" },
      };
    }
    throw err;
  }
  redirect(`/attestation/${savedId}`);
}

export async function markAttestationVerified(attestationId: number) {
  const user = await requireRole("editor");
  await db
    .update(schema.attestations)
    .set({ lastVerifiedAt: new Date(), updatedById: user.id })
    .where(eq(schema.attestations.id, attestationId));
  redirect(`/attestation/${attestationId}?checked=1`);
}

export async function deleteAttestation(attestationId: number) {
  await requireRole("admin");
  await deleteWithHistory("attestation", attestationId, () =>
    db.delete(schema.attestations).where(eq(schema.attestations.id, attestationId)),
  );
  redirect("/attestation");
}
