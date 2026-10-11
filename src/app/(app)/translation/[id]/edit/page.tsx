import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/badges";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getTranslation, listDocumentTypes, listLanguages } from "@/lib/data";
import { TranslationForm } from "../../translation-form";

export const metadata: Metadata = { title: "Edit translation price" };

export default function EditTranslationPage({ params }: PageProps<"/translation/[id]/edit">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: { params: PageProps<"/translation/[id]/edit">["params"] }) {
  await requireRole("editor");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row, documentTypes, languages] = await Promise.all([
    getTranslation(id),
    listDocumentTypes(),
    listLanguages(),
  ]);
  if (!row) notFound();
  return (
    <>
      <PageHeader
        title={`Edit: ${row.t.sourceLanguage} → ${row.t.targetLanguage}`}
        subtitle={row.t.code && <Tag>{row.t.code}</Tag>}
        back={{ href: `/translation/${id}`, label: "Back to price" }}
      />
      <TranslationForm translation={row.t} documentTypes={documentTypes} languages={languages} />
    </>
  );
}
