"use client";

import { startTransition, useActionState, useState, type ComponentProps, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/form";
import { buttonStyles, cx } from "./ui";

/**
 * Like useActionState on a <form action>, but the form keeps what the person
 * typed when the server returns a validation error (React resets forms after
 * a form action otherwise).
 */
export function useKeepValuesForm(
  serverAction: (prev: ActionState, formData: FormData) => Promise<ActionState>,
) {
  const [state, dispatch, pending] = useActionState(serverAction, {});
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }
  return { state, onSubmit, pending };
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
  confirmText,
  pending: pendingOverride,
  ...props
}: ComponentProps<"button"> & {
  pendingText?: string;
  variant?: keyof typeof buttonStyles;
  confirmText?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      className={cx(buttonStyles[variant], className)}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

/** Copies a client-ready message, with an option to leave prices out. */
export function CopyMessage({
  withPrice,
  withoutPrice,
}: {
  withPrice: string;
  withoutPrice: string;
}) {
  const [includePrice, setIncludePrice] = useState(true);
  const [copied, setCopied] = useState(false);
  const text = includePrice ? withPrice : withoutPrice;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older mobile browsers: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">Message for the client</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={includePrice}
            onChange={(e) => setIncludePrice(e.target.checked)}
            className="h-4 w-4 accent-stamp"
          />
          Include prices
        </label>
      </div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-paper p-3 font-sans text-sm leading-relaxed text-ink">
        {text}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={buttonStyles.primary}>
          {copied ? "Copied" : "Copy message"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles.secondary}
        >
          Open in WhatsApp
        </a>
      </div>
    </div>
  );
}
