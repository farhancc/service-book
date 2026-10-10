"use client";

import { NotesFields, PricingFields, StepsEditor } from "@/components/form-fields";
import { SubmitButton, useKeepValuesForm } from "@/components/client";
import { ButtonLink, Field, FormError, inputClass } from "@/components/ui";
import type { Attestation, Country, DocumentType } from "@/db/schema";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/format";
import { saveAttestation } from "./actions";

export function AttestationForm({
  attestation,
  countries,
  documentTypes,
  preset,
}: {
  attestation: Attestation | null;
  countries: Country[];
  documentTypes: DocumentType[];
  preset?: { countryId?: number; documentTypeId?: number };
}) {
  const { state, onSubmit, pending } = useKeepValuesForm(
    saveAttestation.bind(null, attestation?.id ?? null),
  );
  const e = state.fieldErrors;
  const a = attestation;

  const byCategory = Object.entries(DOCUMENT_CATEGORY_LABELS)
    .map(([cat, label]) => ({ label, items: documentTypes.filter((d) => d.category === cat) }))
    .filter((g) => g.items.length);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError message={state.error} />
      <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-3 sm:p-5">
        <legend className="px-1 text-base font-bold">Which document</legend>
        <Field label="Issuing country" name="countryId" error={e?.countryId}>
          <select
            id="countryId"
            name="countryId"
            defaultValue={a?.countryId ?? preset?.countryId ?? ""}
            className={inputClass}
            required
          >
            <option value="">Choose…</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Document" name="documentTypeId" error={e?.documentTypeId}>
          <select
            id="documentTypeId"
            name="documentTypeId"
            defaultValue={a?.documentTypeId ?? preset?.documentTypeId ?? ""}
            className={inputClass}
            required
          >
            <option value="">Choose…</option>
            {byCategory.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Variant" name="variant" error={e?.variant} hint="Standard, Urgent, Apostille…">
          <input id="variant" name="variant" defaultValue={a?.variant ?? "Standard"} className={inputClass} />
        </Field>
      </fieldset>

      <StepsEditor initial={a?.steps ?? []} error={e?.steps} />

      <fieldset className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <legend className="px-1 text-base font-bold">Documents the client must give</legend>
        <Field label="One per line" name="requiredDocuments" error={e?.requiredDocuments}>
          <textarea
            id="requiredDocuments"
            name="requiredDocuments"
            rows={5}
            defaultValue={a?.requiredDocuments.join("\n") ?? ""}
            placeholder={"Original certificate\nPassport copy\nVisa copy"}
            className={inputClass}
          />
        </Field>
      </fieldset>

      <PricingFields defaults={a ?? {}} errors={e} isNew={!a} />
      <NotesFields defaults={a ?? {}} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{a ? "Save changes" : "Add attestation route"}</SubmitButton>
        <ButtonLink href={a ? `/attestation/${a.id}` : "/attestation"} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
