import { z } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: string;
};

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Money in AED: empty → null, otherwise a non-negative number with up to 2 decimals. */
export const money = z.preprocess(
  (v) => {
    const b = blankToNull(v);
    return typeof b === "string" ? b.replace(/,/g, "").trim() : b;
  },
  z
    .string()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter an amount like 350 or 350.50")
    .nullable(),
);

export const optionalInt = z.preprocess(
  blankToNull,
  z.coerce.number().int("Whole days only").min(0, "Can't be negative").max(3650).nullable(),
);

export const optionalText = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() || null : null),
  z.string().max(5000).nullable(),
);

export const requiredText = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(1, `${label} is required`).max(500),
  );

/** One item per line in a textarea. */
export const lines = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : [],
  z.array(z.string().max(500)).max(100),
);

export const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

export const id = z.coerce.number().int().positive();

/** Shared priced-entry fields. */
export const pricingFields = {
  priceAed: money,
  governmentFeesAed: money,
  priceNote: optionalText,
  turnaroundMinDays: optionalInt,
  turnaroundMaxDays: optionalInt,
  available: checkbox,
  clientNotes: optionalText,
  internalNotes: optionalText,
  markVerified: checkbox,
};

export function toFieldErrors(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { error: "Check the highlighted fields.", fieldErrors };
}

export function turnaroundError(min: number | null, max: number | null): ActionState | null {
  if (min != null && max != null && min > max) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { turnaroundMaxDays: "Max days must be at least the min days" },
    };
  }
  return null;
}

/** Postgres unique-violation code. */
export function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export function isForeignKeyViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23503" || e?.cause?.code === "23503";
}
