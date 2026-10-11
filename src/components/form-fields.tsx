"use client";

import { useState } from "react";
import type { AttestationStep } from "@/db/schema";
import { buttonStyles, Field, inputClass } from "./ui";

type Errors = Record<string, string> | undefined;

export type PricingDefaults = {
  priceAed?: string | null;
  costAed?: string | null;
  governmentFeesAed?: string | null;
  priceNote?: string | null;
  turnaroundMinDays?: number | null;
  turnaroundMaxDays?: number | null;
  available?: boolean;
  clientNotes?: string | null;
  internalNotes?: string | null;
};

function err(errors: Errors, name: string) {
  return errors?.[name];
}

function invalid(errors: Errors, name: string) {
  return errors?.[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};
}

export function PricingFields({
  defaults,
  errors,
  isNew,
  priceLabel = "Our fee (AED)",
  extra,
}: {
  defaults: PricingDefaults;
  errors: Errors;
  isNew: boolean;
  priceLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 text-base font-bold">Price and timing</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={priceLabel} name="priceAed" error={err(errors, "priceAed")} hint="Leave blank if unknown">
          <input
            id="priceAed"
            name="priceAed"
            inputMode="decimal"
            defaultValue={defaults.priceAed ?? ""}
            className={inputClass}
            {...invalid(errors, "priceAed")}
          />
        </Field>
        <Field
          label="Government fees (AED)"
          name="governmentFeesAed"
          error={err(errors, "governmentFeesAed")}
          hint="Charged on top, if any"
        >
          <input
            id="governmentFeesAed"
            name="governmentFeesAed"
            inputMode="decimal"
            defaultValue={defaults.governmentFeesAed ?? ""}
            className={inputClass}
            {...invalid(errors, "governmentFeesAed")}
          />
        </Field>
        <Field
          label="Our cost (AED)"
          name="costAed"
          error={err(errors, "costAed")}
          hint="What it costs us. Internal only, never shown to clients"
        >
          <input
            id="costAed"
            name="costAed"
            inputMode="decimal"
            defaultValue={defaults.costAed ?? ""}
            className={inputClass}
            {...invalid(errors, "costAed")}
          />
        </Field>
        {extra}
        <Field label="Turnaround from (working days)" name="turnaroundMinDays" error={err(errors, "turnaroundMinDays")}>
          <input
            id="turnaroundMinDays"
            name="turnaroundMinDays"
            inputMode="numeric"
            defaultValue={defaults.turnaroundMinDays ?? ""}
            className={inputClass}
            {...invalid(errors, "turnaroundMinDays")}
          />
        </Field>
        <Field label="Turnaround to (working days)" name="turnaroundMaxDays" error={err(errors, "turnaroundMaxDays")}>
          <input
            id="turnaroundMaxDays"
            name="turnaroundMaxDays"
            inputMode="numeric"
            defaultValue={defaults.turnaroundMaxDays ?? ""}
            className={inputClass}
            {...invalid(errors, "turnaroundMaxDays")}
          />
        </Field>
      </div>
      <Field
        label="Price note"
        name="priceNote"
        hint="Shown to clients with the price, e.g. “Urgent service +AED 200” or “Per document, VAT extra”"
      >
        <input id="priceNote" name="priceNote" defaultValue={defaults.priceNote ?? ""} className={inputClass} />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="available"
            defaultChecked={defaults.available ?? true}
            className="h-4 w-4 accent-stamp"
          />
          We offer this
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="markVerified" defaultChecked={isNew} className="h-4 w-4 accent-stamp" />
          I confirmed this price today
        </label>
      </div>
    </fieldset>
  );
}

export function NotesFields({ defaults }: { defaults: PricingDefaults }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 text-base font-bold">Notes</legend>
      <Field label="Note for clients" name="clientNotes" hint="Added to the WhatsApp message">
        <textarea
          id="clientNotes"
          name="clientNotes"
          rows={3}
          defaultValue={defaults.clientNotes ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Internal note" name="internalNotes" hint="Team only. Never included in client messages">
        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={3}
          defaultValue={defaults.internalNotes ?? ""}
          className={inputClass}
        />
      </Field>
    </fieldset>
  );
}

type DraftStep = AttestationStep & { key: number };

/** Ordered list of process steps, sent to the server as JSON in a hidden input. */
export function StepsEditor({ initial, error }: { initial: AttestationStep[]; error?: string }) {
  const [steps, setSteps] = useState<DraftStep[]>(() =>
    (initial.length ? initial : [{ title: "" }]).map((s, i) => ({ ...s, key: i })),
  );
  const [nextKey, setNextKey] = useState(initial.length + 1);

  const update = (key: number, patch: Partial<AttestationStep>) =>
    setSteps((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (index: number, dir: -1 | 1) =>
    setSteps((all) => {
      const next = [...all];
      const target = index + dir;
      if (target < 0 || target >= next.length) return all;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const add = () => {
    setSteps((all) => [...all, { title: "", key: nextKey }]);
    setNextKey((k) => k + 1);
  };
  const remove = (key: number) => setSteps((all) => all.filter((s) => s.key !== key));

  const payload = JSON.stringify(
    steps.filter((s) => s.title.trim() !== "").map(({ key: _key, ...s }) => s),
  );

  return (
    <fieldset className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 text-base font-bold">Process, in order</legend>
      <input type="hidden" name="steps" value={payload} />
      {error && <p className="mb-3 text-sm text-seal">{error}</p>}
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.key} className="rounded-md border border-line bg-paper p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-stamp">Step {i + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move step ${i + 1} up`}
                  className="rounded px-2 py-1 text-sm text-muted hover:bg-surface disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === steps.length - 1}
                  aria-label={`Move step ${i + 1} down`}
                  className="rounded px-2 py-1 text-sm text-muted hover:bg-surface disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.key)}
                  aria-label={`Remove step ${i + 1}`}
                  className="rounded px-2 py-1 text-sm text-seal hover:bg-seal-soft"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                aria-label={`Step ${i + 1} name`}
                placeholder="Step, e.g. MOFA attestation"
                value={s.title}
                onChange={(e) => update(s.key, { title: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
              <input
                aria-label={`Step ${i + 1} authority`}
                placeholder="Authority or office"
                value={s.authority ?? ""}
                onChange={(e) => update(s.key, { authority: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Step ${i + 1} location`}
                placeholder="Where (Home country / UAE)"
                value={s.where ?? ""}
                onChange={(e) => update(s.key, { where: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Step ${i + 1} days`}
                placeholder="Days, e.g. 3–5"
                value={s.days ?? ""}
                onChange={(e) => update(s.key, { days: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Step ${i + 1} notes`}
                placeholder="Notes (optional)"
                value={s.notes ?? ""}
                onChange={(e) => update(s.key, { notes: e.target.value })}
                className={inputClass}
              />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={add} className={`${buttonStyles.secondary} mt-3`}>
        Add step
      </button>
    </fieldset>
  );
}
