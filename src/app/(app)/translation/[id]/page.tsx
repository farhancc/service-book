import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/badges";
import { CopyMessage } from "@/components/client";
import { CheckedNotice, EntryActions, HistoryList, PriceCard } from "@/components/detail";
import { LoadingBlock, PageHeader, Section } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { getTranslation, requestNow } from "@/lib/data";
import { formatAed, PRICING_UNIT_LABELS, TRANSLATION_KIND_LABELS } from "@/lib/format";
import { getHistory } from "@/lib/history";
import { translationMessage } from "@/lib/whatsapp";
import { deleteTranslation, markTranslationVerified } from "../actions";

export const metadata: Metadata = { title: "Translation price" };

export default function TranslationPage({ params, searchParams }: PageProps<"/translation/[id]">) {
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
  params: PageProps<"/translation/[id]">["params"];
  searchParams: PageProps<"/translation/[id]">["searchParams"];
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [user, row, history, sp] = await Promise.all([
    getUser(),
    getTranslation(id),
    getHistory("translation", id),
    searchParams,
  ]);
  if (!row) notFound();
  const { t, documentType } = row;
  const kind = TRANSLATION_KIND_LABELS[t.kind];
  const unit = PRICING_UNIT_LABELS[t.pricingUnit];
  const minimum = formatAed(t.minimumChargeAed);

  return (
    <>
      <CheckedNotice show={sp.checked === "1"} />
      <PageHeader
        title={`${t.sourceLanguage} → ${t.targetLanguage}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {t.code && <Tag>{t.code}</Tag>}
            <Tag>{kind}</Tag>
            <span>{documentType ?? "Any document"}</span>
          </span>
        }
        back={{ href: "/translation", label: "Translation" }}
        actions={
          <EntryActions
            user={user}
            editHref={`/translation/${id}/edit`}
            markVerified={markTranslationVerified.bind(null, id)}
            remove={deleteTranslation.bind(null, id)}
            deleteWhat={`the ${t.sourceLanguage} to ${t.targetLanguage} price`}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          <PriceCard
            item={t}
            now={await requestNow()}
            user={user}
            unitLabel={unit}
            extra={
              minimum && (
                <div>
                  <dt className="text-sm text-muted">Minimum charge</dt>
                  <dd className="text-xl font-bold">{minimum}</dd>
                </div>
              )
            }
          />
          {t.clientNotes && (
            <Section title="Note for clients">
              <p className="whitespace-pre-line">{t.clientNotes}</p>
            </Section>
          )}
        </div>
        <div className="space-y-4">
          <CopyMessage
            withPrice={translationMessage(t, kind, unit, documentType, true)}
            withoutPrice={translationMessage(t, kind, unit, documentType, false)}
          />
          {user && <HistoryList rows={history} />}
        </div>
      </div>
    </>
  );
}
