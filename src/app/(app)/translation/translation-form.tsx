"use client";

import { SubmitButton, useKeepValuesForm } from "@/components/client";
import { NotesFields, PricingFields } from "@/components/form-fields";
import { ButtonLink, Field, FormError, inputClass } from "@/components/ui";
import type { DocumentType, Translation } from "@/db/schema";
import { PRICING_UNIT_LABELS, TRANSLATION_KIND_LABELS } from "@/lib/format";
import { saveTranslation } from "./actions";

const COMMON_LANGUAGES = [
  "Arabic", "English", "Hindi", "Urdu", "Malayalam", "Tamil", "Bengali", "Tagalog",
  "French", "German", "Spanish", "Russian", "Chinese", "Persian", "Turkish", "Italian",
];

export function TranslationForm({
  translation,
  documentTypes,
  languages,
}: {
  translation: Translation | null;
  documentTypes: DocumentType[];
  languages: string[];
}) {
  const { state, onSubmit, pending } = useKeepValuesForm(saveTranslation.bind(null, translation?.id ?? null));
  const e = state.fieldErrors;
  const t = translation;
  const allLanguages = [...new Set([...languages, ...COMMON_LANGUAGES])].sort();

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError message={state.error} />
      <datalist id="languages">
        {allLanguages.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-1 text-base font-bold">What gets translated</legend>
        <Field label="From language" name="sourceLanguage" error={e?.sourceLanguage}>
          <input
            id="sourceLanguage"
            name="sourceLanguage"
            list="languages"
            defaultValue={t?.sourceLanguage ?? ""}
            required
            className={inputClass}
          />
        </Field>
        <Field label="To language" name="targetLanguage" error={e?.targetLanguage}>
          <input
            id="targetLanguage"
            name="targetLanguage"
            list="languages"
            defaultValue={t?.targetLanguage ?? "Arabic"}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Document" name="documentTypeId" hint="Leave as “Any document” for a general rate">
          <select
            id="documentTypeId"
            name="documentTypeId"
            defaultValue={t?.documentTypeId ?? ""}
            className={inputClass}
          >
            <option value="">Any document</option>
            {documentTypes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" name="kind">
          <select id="kind" name="kind" defaultValue={t?.kind ?? "legal"} className={inputClass}>
            {Object.entries(TRANSLATION_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <PricingFields
        defaults={t ?? {}}
        errors={e}
        isNew={!t}
        extra={
          <>
            <Field label="Priced" name="pricingUnit">
              <select id="pricingUnit" name="pricingUnit" defaultValue={t?.pricingUnit ?? "page"} className={inputClass}>
                {Object.entries(PRICING_UNIT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Minimum charge (AED)" name="minimumChargeAed" error={e?.minimumChargeAed}>
              <input
                id="minimumChargeAed"
                name="minimumChargeAed"
                inputMode="decimal"
                defaultValue={t?.minimumChargeAed ?? ""}
                className={inputClass}
              />
            </Field>
          </>
        }
      />
      <NotesFields defaults={t ?? {}} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{t ? "Save changes" : "Add translation price"}</SubmitButton>
        <ButtonLink href={t ? `/translation/${t.id}` : "/translation"} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
