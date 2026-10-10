"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client";
import { cx, inputClass } from "@/components/ui";
import type { Country, DocumentType } from "@/db/schema";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/format";
import type { ActionState } from "@/lib/form";
import { deleteCountry, deleteDocumentType, saveCountry, saveDocumentType } from "./actions";

function Message({ state }: { state: ActionState }) {
  const text = (state.fieldErrors && Object.values(state.fieldErrors)[0]) ?? state.error ?? state.ok;
  if (!text) return null;
  return (
    <p role="status" className={cx("mt-1 text-sm", state.error ? "text-seal" : "text-verified")}>
      {text}
    </p>
  );
}

const small = "px-3 py-2";

export function CountryRow({ country, canDelete }: { country: Country; canDelete: boolean }) {
  const [saveState, save] = useActionState(saveCountry.bind(null, country.id), {});
  const [delState, del] = useActionState(deleteCountry.bind(null, country.id), {});
  return (
    <li className="py-2.5">
      <form action={save} className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          defaultValue={country.name}
          aria-label="Country name"
          className={cx(inputClass, "min-w-0 flex-1 py-2")}
        />
        <input
          name="code"
          defaultValue={country.code ?? ""}
          aria-label="Country code"
          placeholder="Code"
          maxLength={2}
          className={cx(inputClass, "w-20 py-2 uppercase")}
        />
        <SubmitButton variant="secondary" className={small}>
          Save
        </SubmitButton>
        {canDelete && (
          <SubmitButton
            variant="danger"
            className={small}
            formAction={del}
            pendingText="…"
            confirmText={`Delete ${country.name}?`}
          >
            Delete
          </SubmitButton>
        )}
      </form>
      <Message state={delState.error ? delState : saveState} />
    </li>
  );
}

export function AddCountryForm() {
  const [state, action] = useActionState(saveCountry.bind(null, null), {});
  return (
    <form action={action} className="mb-2 rounded-md bg-paper p-3">
      <div className="flex flex-wrap gap-2">
        <input name="name" placeholder="New country" aria-label="New country name" required className={cx(inputClass, "min-w-0 flex-1 py-2")} />
        <input name="code" placeholder="Code" aria-label="New country code" maxLength={2} className={cx(inputClass, "w-20 py-2 uppercase")} />
        <SubmitButton className={small} pendingText="Adding…">
          Add country
        </SubmitButton>
      </div>
      <Message state={state} />
    </form>
  );
}

function CategorySelect({ value }: { value?: string }) {
  return (
    <select name="category" defaultValue={value ?? "other"} aria-label="Category" className={cx(inputClass, "w-40 py-2")}>
      {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function DocumentTypeRow({ documentType, canDelete }: { documentType: DocumentType; canDelete: boolean }) {
  const [saveState, save] = useActionState(saveDocumentType.bind(null, documentType.id), {});
  const [delState, del] = useActionState(deleteDocumentType.bind(null, documentType.id), {});
  return (
    <li className="py-2.5">
      <form action={save} className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          defaultValue={documentType.name}
          aria-label="Document name"
          className={cx(inputClass, "min-w-0 flex-1 py-2")}
        />
        <CategorySelect value={documentType.category} />
        <SubmitButton variant="secondary" className={small}>
          Save
        </SubmitButton>
        {canDelete && (
          <SubmitButton
            variant="danger"
            className={small}
            formAction={del}
            pendingText="…"
            confirmText={`Delete ${documentType.name}?`}
          >
            Delete
          </SubmitButton>
        )}
      </form>
      <Message state={delState.error ? delState : saveState} />
    </li>
  );
}

export function AddDocumentTypeForm() {
  const [state, action] = useActionState(saveDocumentType.bind(null, null), {});
  return (
    <form action={action} className="mb-2 rounded-md bg-paper p-3">
      <div className="flex flex-wrap gap-2">
        <input name="name" placeholder="New document type" aria-label="New document name" required className={cx(inputClass, "min-w-0 flex-1 py-2")} />
        <CategorySelect />
        <SubmitButton className={small} pendingText="Adding…">
          Add document
        </SubmitButton>
      </div>
      <Message state={state} />
    </form>
  );
}
