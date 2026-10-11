import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveFilterForm } from "@/components/client";
import { TranslationList } from "@/components/lists";
import { ButtonLink, Empty, inputClass, LoadingBlock, PageHeader } from "@/components/ui";
import { getUser, hasRole } from "@/lib/auth";
import { listTranslations, requestNow } from "@/lib/data";
import { TRANSLATION_KIND_LABELS } from "@/lib/format";

export const metadata: Metadata = { title: "Translation" };

export default function TranslationIndex({ searchParams }: PageProps<"/translation">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Index searchParams={searchParams} />
    </Suspense>
  );
}

async function Index({ searchParams }: { searchParams: PageProps<"/translation">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const kind = typeof sp.kind === "string" ? sp.kind : "";
  const [user, items] = await Promise.all([getUser(), listTranslations({ q, kind })]);
  const canEdit = Boolean(user && hasRole(user, "editor"));

  return (
    <>
      <PageHeader
        title="Translation"
        subtitle="Which languages and documents we translate, and what it costs."
        actions={canEdit && <ButtonLink href="/translation/new">Add price</ButtonLink>}
      />
      <LiveFilterForm action="/translation" className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Language or document, e.g. Russian"
          aria-label="Language or document"
          className={inputClass}
        />
        <select name="kind" defaultValue={kind} aria-label="Type" className={inputClass}>
          <option value="">All types</option>
          {Object.entries(TRANSLATION_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-stamp px-5 py-2.5 font-semibold text-white">
          Filter
        </button>
      </LiveFilterForm>
      {items.length ? (
        <TranslationList items={items} now={await requestNow()} />
      ) : (
        <Empty action={canEdit && <ButtonLink href="/translation/new">Add a translation price</ButtonLink>}>
          {q || kind
            ? "We have no price for that yet. If a client asks, check with operations and add it here."
            : "No translation prices yet."}
        </Empty>
      )}
    </>
  );
}
