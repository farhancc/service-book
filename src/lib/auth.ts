import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Role } from "@/db/schema";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session-token";

export type CurrentUser = { id: number; name: string; email: string; role: Role };

const RANK: Record<Role, number> = { viewer: 1, editor: 2, admin: 3 };

export function hasRole(user: Pick<CurrentUser, "role">, min: Role) {
  return RANK[user.role] >= RANK[min];
}

/**
 * Reads the session cookie and loads the user fresh from the database, so a
 * deactivated account or a changed role takes effect on the next request.
 * Deduplicated per request.
 */
export const getUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.userId),
    columns: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Use in every Server Action and in pages that change data. */
export async function requireRole(min: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasRole(user, min)) redirect("/?denied=1");
  return user;
}

export async function startSession(userId: number) {
  const token = await signSession({ userId });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
