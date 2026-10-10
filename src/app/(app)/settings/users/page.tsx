import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Suspense } from "react";
import { LoadingBlock, PageHeader, Section } from "@/components/ui";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { NewUserForm, UserRow } from "../user-forms";

export const metadata: Metadata = { title: "Team and access" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Team and access"
        subtitle="Viewers can search and copy. Editors can change entries. Admins can delete and manage the team."
        back={{ href: "/settings", label: "Settings" }}
      />
      <Suspense fallback={<LoadingBlock />}>
        <Users />
      </Suspense>
    </>
  );
}

async function Users() {
  const me = await requireRole("admin");
  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      active: schema.users.active,
    })
    .from(schema.users)
    .orderBy(asc(schema.users.name));
  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <Section title={`Team (${users.length})`}>
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <UserRow key={`${u.id}-${u.role}-${u.active}`} user={u} isMe={u.id === me.id} />
          ))}
        </ul>
      </Section>
      <Section title="Add a team member">
        <NewUserForm />
      </Section>
    </div>
  );
}
