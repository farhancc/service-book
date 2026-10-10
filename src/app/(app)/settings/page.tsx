import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingBlock, PageHeader, Section } from "@/components/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { listCountries, listDocumentTypes } from "@/lib/data";
import { AddCountryForm, AddDocumentTypeForm, CountryRow, DocumentTypeRow } from "./reference-forms";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Lists used across the book, your account and the team." />
      <Suspense fallback={<LoadingBlock />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const user = await requireUser();
  const [countries, documentTypes] = await Promise.all([listCountries(), listDocumentTypes()]);
  const canEdit = hasRole(user, "editor");
  const canDelete = hasRole(user, "admin");

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        <Link href="/settings/account" className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-stamp">
          My account
        </Link>
        {canDelete && (
          <Link href="/settings/users" className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-stamp">
            Team and access
          </Link>
        )}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={`Countries (${countries.length})`}>
          {canEdit ? (
            <>
              <AddCountryForm />
              <ul className="divide-y divide-line">
                {countries.map((c) => (
                  <CountryRow key={`${c.id}-${c.name}-${c.code}`} country={c} canDelete={canDelete} />
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted">{countries.map((c) => c.name).join(", ")}</p>
          )}
        </Section>

        <Section title={`Document types (${documentTypes.length})`}>
          {canEdit ? (
            <>
              <AddDocumentTypeForm />
              <ul className="divide-y divide-line">
                {documentTypes.map((d) => (
                  <DocumentTypeRow key={`${d.id}-${d.name}-${d.category}`} documentType={d} canDelete={canDelete} />
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted">{documentTypes.map((d) => d.name).join(", ")}</p>
          )}
        </Section>
      </div>
    </div>
  );
}
