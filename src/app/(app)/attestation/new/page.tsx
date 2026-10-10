import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listCountries, listDocumentTypes } from "@/lib/data";
import { AttestationForm } from "../attestation-form";

export const metadata: Metadata = { title: "Add attestation route" };

export default function NewAttestationPage({ searchParams }: PageProps<"/attestation/new">) {
  return (
    <>
      <PageHeader title="Add attestation route" back={{ href: "/attestation", label: "Attestation" }} />
      <Suspense fallback={<LoadingBlock />}>
        <NewForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewForm({ searchParams }: { searchParams: PageProps<"/attestation/new">["searchParams"] }) {
  await requireRole("editor");
  const sp = await searchParams;
  const countryId = typeof sp.country === "string" ? Number(sp.country) || undefined : undefined;
  const [countries, documentTypes] = await Promise.all([listCountries(), listDocumentTypes()]);
  return (
    <AttestationForm
      attestation={null}
      countries={countries}
      documentTypes={documentTypes}
      preset={{ countryId }}
    />
  );
}
