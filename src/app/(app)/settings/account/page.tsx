import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock, PageHeader, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/format";
import { ChangePasswordForm } from "../user-forms";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="My account" back={{ href: "/settings", label: "Settings" }} />
      <Suspense fallback={<LoadingBlock />}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const me = await requireUser();
  return (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <Section title="Details">
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-muted">Name</dt>
            <dd className="font-semibold">{me.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Email</dt>
            <dd className="font-semibold">{me.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Role</dt>
            <dd className="font-semibold">{ROLE_LABELS[me.role]}</dd>
          </div>
        </dl>
      </Section>
      <Section title="Change password">
        <ChangePasswordForm />
      </Section>
    </div>
  );
}
