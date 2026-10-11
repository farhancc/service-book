"use client";

import { useActionState } from "react";
import { PasswordInput, SubmitButton } from "@/components/client";
import { cx, Field, FormError, inputClass } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/format";
import type { ActionState } from "@/lib/form";
import { changePassword, createUser, updateUser } from "./actions";

function Ok({ state }: { state: ActionState }) {
  if (!state.ok) return null;
  return (
    <p role="status" className="text-sm font-medium text-verified">
      {state.ok}
    </p>
  );
}

const ROLE_HELP = {
  viewer: "Can search and copy messages",
  editor: "Can also add and change entries",
  admin: "Can also delete and manage the team",
} as const;

function RoleSelect({ value }: { value: string }) {
  return (
    <select name="role" defaultValue={value} aria-label="Role" className={cx(inputClass, "py-2")}>
      {Object.entries(ROLE_LABELS).map(([v, label]) => (
        <option key={v} value={v}>
          {label}: {ROLE_HELP[v as keyof typeof ROLE_HELP]}
        </option>
      ))}
    </select>
  );
}

export function NewUserForm() {
  const [state, action] = useActionState(createUser, {});
  const e = state.fieldErrors;
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      <Ok state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" name="name" error={e?.name}>
          <input id="name" name="name" required className={inputClass} />
        </Field>
        <Field label="Work email" name="email" error={e?.email}>
          <input id="email" name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Role" name="role">
          <RoleSelect value="viewer" />
        </Field>
        <Field label="Starting password" name="password" error={e?.password} hint="At least 10 characters. They can change it later">
          <input id="password" name="password" type="text" autoComplete="new-password" required className={inputClass} />
        </Field>
      </div>
      <SubmitButton pendingText="Adding…">Add team member</SubmitButton>
    </form>
  );
}

export function UserRow({
  user,
  isMe,
}: {
  user: { id: number; name: string; email: string; role: string; active: boolean };
  isMe: boolean;
}) {
  const [state, action] = useActionState(updateUser.bind(null, user.id), {});
  return (
    <li className="py-3">
      <form action={action} className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">
            {user.name} {isMe && <span className="text-sm font-normal text-muted">(you)</span>}
          </p>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
          <RoleSelect value={user.role} />
          <input
            name="password"
            type="text"
            autoComplete="new-password"
            placeholder="New password (optional)"
            aria-label={`New password for ${user.name}`}
            className={cx(inputClass, "py-2")}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={user.active} className="h-4 w-4 accent-stamp" />
            Can sign in
          </label>
          <SubmitButton variant="secondary" className="px-3 py-2">
            Save
          </SubmitButton>
        </div>
        {(state.error || state.fieldErrors) && (
          <p className="text-sm text-seal">{state.fieldErrors ? Object.values(state.fieldErrors)[0] : state.error}</p>
        )}
        <Ok state={state} />
      </form>
    </li>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, {});
  const e = state.fieldErrors;
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      <Ok state={state} />
      <Field label="Current password" name="current" error={e?.current}>
        <PasswordInput id="current" name="current" autoComplete="current-password" required />
      </Field>
      <Field label="New password" name="next" error={e?.next} hint="At least 10 characters">
        <PasswordInput id="next" name="next" autoComplete="new-password" required />
      </Field>
      <Field label="Type it again" name="confirm" error={e?.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}
