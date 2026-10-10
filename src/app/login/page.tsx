import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span aria-hidden className="stamp inline-block h-11 w-11 rounded-full" />
          <div>
            <p className="text-xl font-extrabold tracking-tight">Service Book</p>
            <p className="text-sm text-muted">Processes and prices for the sales team</p>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <LoginForm />
        </div>
        <p className="mt-4 text-sm text-muted">No account? Ask your admin to add you.</p>
      </div>
    </main>
  );
}
