import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getService } from "@/lib/data";
import { ServiceForm } from "../../service-form";

export const metadata: Metadata = { title: "Edit service" };

export default function EditServicePage({ params }: PageProps<"/services/[id]/edit">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: { params: PageProps<"/services/[id]/edit">["params"] }) {
  await requireRole("editor");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const service = await getService(id);
  if (!service) notFound();
  return (
    <>
      <PageHeader title={`Edit: ${service.name}`} back={{ href: `/services/${id}`, label: "Back to service" }} />
      <ServiceForm service={service} />
    </>
  );
}
