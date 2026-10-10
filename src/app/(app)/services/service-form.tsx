"use client";

import { SubmitButton, useKeepValuesForm } from "@/components/client";
import { NotesFields, PricingFields } from "@/components/form-fields";
import { ButtonLink, Field, FormError, inputClass } from "@/components/ui";
import type { Service } from "@/db/schema";
import { SERVICE_CATEGORY_LABELS } from "@/lib/format";
import { saveService } from "./actions";

export function ServiceForm({ service, presetCategory }: { service: Service | null; presetCategory?: string }) {
  const { state, onSubmit, pending } = useKeepValuesForm(saveService.bind(null, service?.id ?? null));
  const e = state.fieldErrors;
  const s = service;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError message={state.error} />
      <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[2fr_1fr] sm:p-5">
        <legend className="px-1 text-base font-bold">Service</legend>
        <Field label="Name" name="name" error={e?.name}>
          <input
            id="name"
            name="name"
            defaultValue={s?.name ?? ""}
            placeholder="e.g. Free zone company formation"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Category" name="category">
          <select
            id="category"
            name="category"
            defaultValue={s?.category ?? presetCategory ?? "business_setup"}
            className={inputClass}
          >
            {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="What's included" name="description" className="sm:col-span-2" hint="Shown to clients">
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={s?.description ?? ""}
            className={inputClass}
          />
        </Field>
        <Field
          label="What the client must give, one per line"
          name="requirements"
          className="sm:col-span-2"
        >
          <textarea
            id="requirements"
            name="requirements"
            rows={5}
            defaultValue={s?.requirements.join("\n") ?? ""}
            placeholder={"Passport copy\nVisa copy\nProposed trade names"}
            className={inputClass}
          />
        </Field>
      </fieldset>
      <PricingFields defaults={s ?? {}} errors={e} isNew={!s} />
      <NotesFields defaults={s ?? {}} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{s ? "Save changes" : "Add service"}</SubmitButton>
        <ButtonLink href={s ? `/services/${s.id}` : "/services"} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
