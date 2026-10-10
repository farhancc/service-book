import Link from "next/link";
import { Suspense } from "react";
import { FreshnessBadge } from "@/components/badges";
import { AttestationList, ServiceList, TranslationList } from "@/components/lists";
import { Empty, inputClass, LoadingBlock, Section } from "@/components/ui";
import { counts, listCountries, needsVerification, requestNow, searchEverything } from "@/lib/data";
import { freshness } from "@/lib/format";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const denied = sp.denied === "1";

  return (
    <div className="space-y-6">
      {denied && (
        <p role="alert" className="rounded-md border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">
          Your role can&apos;t make that change. Ask an admin if you need editing access.
        </p>
      )}
      <form action="/" role="search" className="relative">
        <label htmlFor="q" className="mb-2 block text-2xl font-extrabold tracking-tight sm:text-3xl">
          What does the client need?
        </label>
        <div className="flex gap-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="India degree, Arabic, trade license…"
            autoComplete="off"
            className={`${inputClass} py-3 text-lg`}
          />
          <button
            type="submit"
            className="rounded-md bg-stamp px-5 font-semibold text-white hover:bg-stamp-dark"
          >
            Search
          </button>
        </div>
      </form>
      {q ? <Results q={q} /> : <Dashboard />}
    </div>
  );
}

async function Results({ q }: { q: string }) {
  const r = await searchEverything(q);
  const now = await requestNow();
  const total = r.attestations.length + r.translations.length + r.services.length;
  if (total === 0) {
    return (
      <Empty>
        Nothing matches &ldquo;{q}&rdquo;. Try a country, a document or a language on its own.
      </Empty>
    );
  }
  return (
    <div className="space-y-6">
      {r.attestations.length > 0 && (
        <div>
          <h2 className="mb-2 font-bold">Attestation</h2>
          <AttestationList items={r.attestations} now={now} />
        </div>
      )}
      {r.translations.length > 0 && (
        <div>
          <h2 className="mb-2 font-bold">Translation</h2>
          <TranslationList items={r.translations} now={now} />
        </div>
      )}
      {r.services.length > 0 && (
        <div>
          <h2 className="mb-2 font-bold">Services</h2>
          <ServiceList items={r.services} now={now} />
        </div>
      )}
    </div>
  );
}

async function Dashboard() {
  const now = await requestNow();
  const [c, stale, allCountries] = await Promise.all([counts(), needsVerification(now), listCountries()]);
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <Section title="Browse attestation by country" className="md:col-span-2">
        <div className="flex flex-wrap gap-2">
          {allCountries.map((country) => (
            <Link
              key={country.id}
              href={`/attestation?country=${country.id}`}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:border-stamp hover:text-stamp"
            >
              {country.name}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Prices to re-check">
        {stale.length === 0 ? (
          <p className="text-sm text-muted">Every price has been checked in the last 90 days.</p>
        ) : (
          <ul className="space-y-2.5">
            {stale.map((s) => (
              <li key={`${s.kind}-${s.id}`} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={s.href} className="font-medium hover:text-stamp">
                  {s.label}
                  <span className="ml-1.5 text-sm text-muted">({s.kind.toLowerCase()})</span>
                </Link>
                <FreshnessBadge state={freshness(s.lastVerifiedAt, now)} date={s.lastVerifiedAt} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="In the book">
        <dl className="grid grid-cols-2 gap-3">
          {[
            ["Attestation routes", c.attestations, "/attestation"],
            ["Translation prices", c.translations, "/translation"],
            ["Services", c.services, "/services"],
            ["Countries", c.countries, "/settings"],
          ].map(([label, n, href]) => (
            <Link key={label as string} href={href as string} className="rounded-md bg-paper p-3 hover:bg-stamp-soft">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-2xl font-extrabold">{n}</dd>
            </Link>
          ))}
        </dl>
      </Section>
    </div>
  );
}
