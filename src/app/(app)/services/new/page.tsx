import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Add service" };

export default function NewServicePage({ searchParams }: PageProps<"/services/new">) {
  return (
    <>
      <PageHeader title="Add service" back={{ href: "/services", label: "Services" }} />
      <Suspense fallback={<LoadingBlock />}>
        <NewForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewForm({ searchParams }: { searchParams: PageProps<"/services/new">["searchParams"] }) {
  await requireRole("editor");
  const sp = await searchParams;
  return <ServiceForm service={null} presetCategory={typeof sp.category === "string" ? sp.category : undefined} />;
}
