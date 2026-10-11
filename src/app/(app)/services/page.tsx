import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ServiceList } from "@/components/lists";
import { ButtonLink, cx, Empty, inputClass, LoadingBlock, PageHeader } from "@/components/ui";
import { getUser, hasRole } from "@/lib/auth";
import { listServices, requestNow } from "@/lib/data";
import { SERVICE_CATEGORY_LABELS } from "@/lib/format";

export const metadata: Metadata = { title: "Services" };

export default function ServicesIndex({ searchParams }: PageProps<"/services">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Index searchParams={searchParams} />
    </Suspense>
  );
}

async function Index({ searchParams }: { searchParams: PageProps<"/services">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const [user, items] = await Promise.all([getUser(), listServices({ q, category })]);
  const canEdit = Boolean(user && hasRole(user, "editor"));
  const newHref = `/services/new${category ? `?category=${category}` : ""}`;

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Business setup, PRO and visa packages."
        actions={canEdit && <ButtonLink href={newHref}>Add service</ButtonLink>}
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {[["", "All"], ...Object.entries(SERVICE_CATEGORY_LABELS)].map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/services?category=${value}` : "/services"}
            aria-current={category === value ? "page" : undefined}
            className={cx(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              category === value ? "border-stamp bg-stamp text-white" : "border-line hover:border-stamp",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <form action="/services" className="mb-5 flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <input name="q" defaultValue={q} placeholder="Search services" aria-label="Search services" className={inputClass} />
        <button type="submit" className="rounded-md bg-stamp px-5 font-semibold text-white">
          Search
        </button>
      </form>
      {items.length ? (
        <ServiceList items={items} now={await requestNow()} />
      ) : (
        <Empty action={canEdit && <ButtonLink href={newHref}>Add a service</ButtonLink>}>
          {q || category ? "No services match." : "No services yet."}
        </Empty>
      )}
    </>
  );
}
