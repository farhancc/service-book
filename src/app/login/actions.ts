"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { endSession, startSession } from "@/lib/auth";
import type { ActionState } from "@/lib/form";

// Compared against when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = "$2b$12$Mievt01KIgkuTUVS9cnAbu16G0ikUnCp0Yld4p7lLE10iCNZwqvc6";

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "That email and password don't match an account." };
  if (!user.active) return { error: "This account is turned off. Ask an admin to turn it back on." };

  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
