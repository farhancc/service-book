import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CopyMessage } from "@/components/client";
import { CheckedNotice, ChecklistSection, EntryActions, HistoryList, PriceCard } from "@/components/detail";
import { LoadingBlock, PageHeader, Section } from "@/components/ui";
import type { AttestationStep } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getAttestation, requestNow } from "@/lib/data";
import { getHistory } from "@/lib/history";
import { attestationMessage } from "@/lib/whatsapp";
import { deleteAttestation, markAttestationVerified } from "../actions";

export const metadata: Metadata = { title: "Attestation route" };

export default function AttestationPage({ params, searchParams }: PageProps<"/attestation/[id]">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Detail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Detail({
  params,
  searchParams,
}: {
  params: PageProps<"/attestation/[id]">["params"];
  searchParams: PageProps<"/attestation/[id]">["searchParams"];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [user, row, history, sp] = await Promise.all([
    requireUser(),
    getAttestation(id),
    getHistory("attestation", id),
    searchParams,
  ]);
  if (!row) notFound();
  const { a, country, documentType } = row;
  const now = await requestNow();

  return (
    <>
      <CheckedNotice show={sp.checked === "1"} />
      <PageHeader
        title={`${documentType} — ${country}`}
        subtitle={a.variant !== "Standard" ? `${a.variant} route` : "Attestation for use in the UAE"}
        back={{ href: `/attestation?country=${a.countryId}`, label: `All ${country} routes` }}
        actions={
          <EntryActions
            user={user}
            editHref={`/attestation/${id}/edit`}
            markVerified={markAttestationVerified.bind(null, id)}
            remove={deleteAttestation.bind(null, id)}
            deleteWhat={`the ${documentType} route for ${country}`}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          <PriceCard item={a} now={now} />
          <StampTrail steps={a.steps} />
          <ChecklistSection title="Documents the client must give" items={a.requiredDocuments} />
          {a.clientNotes && (
            <Section title="Note for clients">
              <p className="whitespace-pre-line">{a.clientNotes}</p>
            </Section>
          )}
        </div>
        <div className="space-y-4">
          <CopyMessage
            withPrice={attestationMessage(a, country, documentType, true)}
            withoutPrice={attestationMessage(a, country, documentType, false)}
          />
          <HistoryList rows={history} />
        </div>
      </div>
    </>
  );
}

/** Each step drawn as an inked seal on a dotted route: the order is the point. */
function StampTrail({ steps }: { steps: AttestationStep[] }) {
  if (!steps.length) {
    return (
      <Section title="Process">
        <p className="text-muted">No steps added yet.</p>
      </Section>
    );
  }
  return (
    <Section title={`Process, ${steps.length} step${steps.length === 1 ? "" : "s"}`}>
      <ol>
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={i} className="grid grid-cols-[2.75rem_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="stamp stamp-in flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-stamp"
                  style={{ animationDelay: `${i * 70}ms`, rotate: `${((i * 37) % 11) - 5}deg` }}
                >
                  {i + 1}
                </span>
                {!last && <span aria-hidden className="stamp-route w-0.5 flex-1 opacity-50" />}
              </div>
              <div className={last ? "pb-1" : "pb-5"}>
                <p className="pt-2.5 font-bold leading-tight">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {[s.authority, s.where, s.days ? `${s.days} days` : null].filter(Boolean).join(", ")}
                </p>
                {s.notes && <p className="mt-1 text-sm">{s.notes}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
