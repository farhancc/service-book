import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/badges";
import { CopyMessage } from "@/components/client";
import { CheckedNotice, ChecklistSection, EntryActions, HistoryList, PriceCard } from "@/components/detail";
import { LoadingBlock, PageHeader, Section } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { getService, requestNow } from "@/lib/data";
import { SERVICE_CATEGORY_LABELS } from "@/lib/format";
import { getHistory } from "@/lib/history";
import { serviceMessage } from "@/lib/whatsapp";
import { deleteService, markServiceVerified } from "../actions";

export const metadata: Metadata = { title: "Service" };

export default function ServicePage({ params, searchParams }: PageProps<"/services/[id]">) {
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
  params: PageProps<"/services/[id]">["params"];
  searchParams: PageProps<"/services/[id]">["searchParams"];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [user, s, history, sp] = await Promise.all([
    getUser(),
    getService(id),
    getHistory("service", id),
    searchParams,
  ]);
  if (!s) notFound();

  return (
    <>
      <CheckedNotice show={sp.checked === "1"} />
      <PageHeader
        title={s.name}
        subtitle={<Tag>{SERVICE_CATEGORY_LABELS[s.category]}</Tag>}
        back={{ href: `/services?category=${s.category}`, label: SERVICE_CATEGORY_LABELS[s.category] }}
        actions={
          <EntryActions
            user={user}
            editHref={`/services/${id}/edit`}
            markVerified={markServiceVerified.bind(null, id)}
            remove={deleteService.bind(null, id)}
            deleteWhat={s.name}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          <PriceCard item={s} now={await requestNow()} user={user} />
          {s.description && (
            <Section title="What's included">
              <p className="whitespace-pre-line">{s.description}</p>
            </Section>
          )}
          <ChecklistSection title="What the client must give" items={s.requirements} />
          {s.clientNotes && (
            <Section title="Note for clients">
              <p className="whitespace-pre-line">{s.clientNotes}</p>
            </Section>
          )}
        </div>
        <div className="space-y-4">
          <CopyMessage withPrice={serviceMessage(s, true)} withoutPrice={serviceMessage(s, false)} />
          <HistoryList rows={history} />
        </div>
      </div>
    </>
  );
}
