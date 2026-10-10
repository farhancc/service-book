import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listDocumentTypes, listLanguages } from "@/lib/data";
import { TranslationForm } from "../translation-form";

export const metadata: Metadata = { title: "Add translation price" };

export default function NewTranslationPage() {
  return (
    <>
      <PageHeader title="Add translation price" back={{ href: "/translation", label: "Translation" }} />
      <Suspense fallback={<LoadingBlock />}>
        <NewForm />
      </Suspense>
    </>
  );
}

async function NewForm() {
  await requireRole("editor");
  const [documentTypes, languages] = await Promise.all([listDocumentTypes(), listLanguages()]);
  return <TranslationForm translation={null} documentTypes={documentTypes} languages={languages} />;
}
