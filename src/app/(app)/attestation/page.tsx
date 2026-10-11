import type { Metadata } from "next";
import { Suspense } from "react";
import { AttestationList } from "@/components/lists";
import { ButtonLink, Empty, inputClass, LoadingBlock, PageHeader } from "@/components/ui";
import { getUser, hasRole } from "@/lib/auth";
import { listAttestations, listCountries, listDocumentTypes, requestNow } from "@/lib/data";

export const metadata: Metadata = { title: "Attestation" };

export default function AttestationIndex({ searchParams }: PageProps<"/attestation">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Index searchParams={searchParams} />
    </Suspense>
  );
}

const num = (v: unknown) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined);

async function Index({ searchParams }: { searchParams: PageProps<"/attestation">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const countryId = num(sp.country);
  const documentTypeId = num(sp.document);

  const [user, items, countries, documentTypes] = await Promise.all([
    getUser(),
    listAttestations({ q, countryId, documentTypeId }),
    listCountries(),
    listDocumentTypes(),
  ]);
  const canEdit = Boolean(user && hasRole(user, "editor"));
  const filtered = Boolean(q || countryId || documentTypeId);
  const newHref = `/attestation/new${countryId ? `?country=${countryId}` : ""}`;

  return (
    <>
      <PageHeader
        title="Attestation"
        subtitle="How each country's documents get attested for use in the UAE."
        actions={canEdit && <ButtonLink href={newHref}>Add route</ButtonLink>}
      />
      <form action="/attestation" className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <select name="country" defaultValue={countryId ?? ""} aria-label="Country" className={inputClass}>
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="document" defaultValue={documentTypeId ?? ""} aria-label="Document" className={inputClass}>
          <option value="">All documents</option>
          {documentTypes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={q} placeholder="Keyword" aria-label="Keyword" className={inputClass} />
        <button type="submit" className="rounded-md bg-stamp px-5 py-2.5 font-semibold text-white">
          Filter
        </button>
      </form>
      {items.length ? (
        <AttestationList items={items} now={await requestNow()} />
      ) : (
        <Empty action={canEdit && <ButtonLink href={newHref}>Add the first route</ButtonLink>}>
          {filtered ? "No attestation routes match these filters yet." : "No attestation routes yet."}
        </Empty>
      )}
    </>
  );
}
