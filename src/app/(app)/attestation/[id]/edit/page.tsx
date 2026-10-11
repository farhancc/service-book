import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/badges";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAttestation, listCountries, listDocumentTypes } from "@/lib/data";
import { AttestationForm } from "../../attestation-form";

export const metadata: Metadata = { title: "Edit attestation route" };

export default function EditAttestationPage({ params }: PageProps<"/attestation/[id]/edit">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: { params: PageProps<"/attestation/[id]/edit">["params"] }) {
  await requireRole("editor");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row, countries, documentTypes] = await Promise.all([
    getAttestation(id),
    listCountries(),
    listDocumentTypes(),
  ]);
  if (!row) notFound();
  return (
    <>
      <PageHeader
        title={`Edit: ${row.documentType} — ${row.country}`}
        subtitle={row.a.code && <Tag>{row.a.code}</Tag>}
        back={{ href: `/attestation/${id}`, label: "Back to route" }}
      />
      <AttestationForm attestation={row.a} countries={countries} documentTypes={documentTypes} />
    </>
  );
}
