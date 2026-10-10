"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole, requireUser } from "@/lib/auth";
import { isForeignKeyViolation, isUniqueViolation, optionalText, requiredText, toFieldErrors, type ActionState } from "@/lib/form";

// ── Countries ──────────────────────────────────────────────────────────────────

const CountryInput = z.object({
  name: requiredText("Country name"),
  code: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim().toUpperCase() : null),
    z.string().regex(/^[A-Z]{2}$/, "Two letters, e.g. IN").nullable(),
  ),
});

export async function saveCountry(existingId: number | null, _prev: ActionState, formData: FormData) {
  await requireRole("editor");
  const parsed = CountryInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    if (existingId) {
      await db.update(schema.countries).set(parsed.data).where(eq(schema.countries.id, existingId));
    } else {
      await db.insert(schema.countries).values(parsed.data);
    }
  } catch (err) {
    if (isUniqueViolation(err)) return { error: `${parsed.data.name} is already in the list.` };
    throw err;
  }
  refresh();
  return { ok: existingId ? "Saved." : `Added ${parsed.data.name}.` };
}

export async function deleteCountry(countryId: number, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  try {
    await db.delete(schema.countries).where(eq(schema.countries.id, countryId));
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return { error: "Attestation routes use this country. Delete or move those first." };
    }
    throw err;
  }
  refresh();
  return { ok: "Deleted." };
}

// ── Document types ─────────────────────────────────────────────────────────────

const DocumentTypeInput = z.object({
  name: requiredText("Document name"),
  category: z.enum(schema.documentCategoryEnum.enumValues),
  description: optionalText,
});

export async function saveDocumentType(existingId: number | null, _prev: ActionState, formData: FormData) {
  await requireRole("editor");
  const parsed = DocumentTypeInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    if (existingId) {
      await db.update(schema.documentTypes).set(parsed.data).where(eq(schema.documentTypes.id, existingId));
    } else {
      await db.insert(schema.documentTypes).values(parsed.data);
    }
  } catch (err) {
    if (isUniqueViolation(err)) return { error: `${parsed.data.name} is already in the list.` };
    throw err;
  }
  refresh();
  return { ok: existingId ? "Saved." : `Added ${parsed.data.name}.` };
}

export async function deleteDocumentType(documentTypeId: number, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  try {
    await db.delete(schema.documentTypes).where(eq(schema.documentTypes.id, documentTypeId));
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return { error: "Attestation routes use this document. Delete or move those first." };
    }
    throw err;
  }
  refresh();
  return { ok: "Deleted." };
}

// ── Users (admin) ──────────────────────────────────────────────────────────────

const password = z.string().min(10, "At least 10 characters").max(200);

const NewUserInput = z.object({
  name: requiredText("Name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(schema.roleEnum.enumValues),
  password,
});

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const parsed = NewUserInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  const { password: pw, ...rest } = parsed.data;
  try {
    await db.insert(schema.users).values({ ...rest, passwordHash: await bcrypt.hash(pw, 12) });
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "Someone already uses that email.", fieldErrors: { email: "Already in use" } };
    throw err;
  }
  refresh();
  return { ok: `Added ${rest.name}. Share the password with them privately.` };
}

const UpdateUserInput = z.object({
  role: z.enum(schema.roleEnum.enumValues),
  active: z.preprocess((v) => v === "on", z.boolean()),
  password: z.preprocess((v) => (v === "" ? undefined : v), password.optional()),
});

export async function updateUser(userId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole("admin");
  const parsed = UpdateUserInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  const { role, active, password: pw } = parsed.data;

  if (userId === me.id && (role !== "admin" || !active)) {
    return { error: "You can't remove your own admin access. Ask another admin." };
  }
  if (role !== "admin" || !active) {
    const otherAdmins = await db.$count(
      schema.users,
      and(eq(schema.users.role, "admin"), eq(schema.users.active, true), ne(schema.users.id, userId)),
    );
    if (otherAdmins === 0) return { error: "Keep at least one active admin." };
  }

  await db
    .update(schema.users)
    .set({ role, active, ...(pw ? { passwordHash: await bcrypt.hash(pw, 12) } : {}) })
    .where(eq(schema.users.id, userId));
  refresh();
  return { ok: pw ? "Saved, with the new password." : "Saved." };
}

// ── Own account ────────────────────────────────────────────────────────────────

const ChangePasswordInput = z
  .object({ current: z.string().min(1, "Enter your current password"), next: password, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  const parsed = ChangePasswordInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  const row = await db.query.users.findFirst({ where: eq(schema.users.id, me.id) });
  if (!row || !(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
    return { error: "Your current password is wrong.", fieldErrors: { current: "Wrong password" } };
  }
  await db
    .update(schema.users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.next, 12) })
    .where(eq(schema.users.id, me.id));
  return { ok: "Password changed." };
}
