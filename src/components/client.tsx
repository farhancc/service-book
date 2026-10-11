"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/form";
import { buttonStyles, cx, inputClass } from "./ui";

/**
 * A filter/search <form> that updates the URL as you type, no submit needed.
 * Text fields are debounced; selects (and Enter) apply immediately.
 */
export function LiveFilterForm({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function submitNow() {
    if (timer.current) clearTimeout(timer.current);
    const params = new URLSearchParams([...new FormData(formRef.current!).entries()] as [string, string][]);
    const qs = params.toString();
    router.replace(qs ? `${action}?${qs}` : action, { scroll: false });
  }

  function onInput() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(submitNow, 300);
  }

  return (
    <form
      ref={formRef}
      action={action}
      role="search"
      onInput={onInput}
      onChange={submitNow}
      onSubmit={(e) => {
        e.preventDefault();
        submitNow();
      }}
      className={className}
    >
      {children}
    </form>
  );
}

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

/** A password input with a toggle to reveal what was typed. */
export function PasswordInput({ className, ...props }: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cx(inputClass, "pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-stamp"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
            <path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.28 3.17M6.6 6.6C4.1 8.3 2 11 2 11s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6" />
          </svg>
        )}
      </button>
    </div>
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
