import Link from "next/link";
import { Suspense } from "react";
import { BottomNav, TopNav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/format";
import { logout } from "../login/actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span aria-hidden className="stamp inline-block h-7 w-7 rounded-full" />
            <span className="text-lg font-extrabold tracking-tight">Service Book</span>
          </Link>
          <TopNav />
          <Suspense fallback={<span className="h-5 w-16" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}

async function UserMenu() {
  const user = await getUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/settings/account" className="hidden text-right sm:block">
        <span className="block font-semibold leading-tight">{user.name}</span>
        <span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span>
      </Link>
      <form action={logout}>
        <button type="submit" className="font-semibold text-muted hover:text-seal">
          Sign out
        </button>
      </form>
    </div>
  );
}
