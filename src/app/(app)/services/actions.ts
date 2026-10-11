"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import {
  lines,
  optionalText,
  pricingFields,
  requiredText,
  toFieldErrors,
  turnaroundError,
  type ActionState,
} from "@/lib/form";
import { SERVICE_CATEGORY_LABELS, serviceCode } from "@/lib/format";
import { deleteWithHistory, recordChanges } from "@/lib/history";

const ServiceInput = z.object({
  category: z.enum(schema.serviceCategoryEnum.enumValues),
  name: requiredText("Service name"),
  description: optionalText,
  requirements: lines,
  ...pricingFields,
});

export async function saveService(
  existingId: number | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("editor");
  const parsed = ServiceInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  const { markVerified, ...input } = parsed.data;
  const bad = turnaroundError(input.turnaroundMinDays, input.turnaroundMaxDays);
  if (bad) return bad;

  const now = new Date();
  const code = serviceCode(SERVICE_CATEGORY_LABELS[input.category], input.name);
  const values = {
    ...input,
    code,
    updatedById: user.id,
    updatedAt: now,
    ...(markVerified ? { lastVerifiedAt: now } : {}),
  };

  let savedId: number;
  if (existingId) {
    const before = await db.query.services.findFirst({ where: eq(schema.services.id, existingId) });
    if (!before) return { error: "This entry was deleted by someone else." };
    await db.update(schema.services).set(values).where(eq(schema.services.id, existingId));
    await recordChanges("service", existingId, before, input, user.id);
    savedId = existingId;
  } else {
    const [row] = await db.insert(schema.services).values(values).returning({ id: schema.services.id });
    await recordChanges("service", row.id, null, input, user.id);
    savedId = row.id;
  }
  redirect(`/services/${savedId}`);
}

export async function markServiceVerified(serviceId: number) {
  const user = await requireRole("editor");
  await db
    .update(schema.services)
    .set({ lastVerifiedAt: new Date(), updatedById: user.id })
    .where(eq(schema.services.id, serviceId));
  redirect(`/services/${serviceId}?checked=1`);
}

export async function deleteService(serviceId: number) {
  await requireRole("admin");
  await deleteWithHistory("service", serviceId, () =>
    db.delete(schema.services).where(eq(schema.services.id, serviceId)),
  );
  redirect("/services");
}
