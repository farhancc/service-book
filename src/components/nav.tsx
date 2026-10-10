"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cx } from "./ui";

const LINKS = [
  { href: "/", label: "Search" },
  { href: "/attestation", label: "Attestation" },
  { href: "/translation", label: "Translation" },
  { href: "/services", label: "Services" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// The current path is request data, so the active state streams in behind
// Suspense; the fallback is the same nav with nothing highlighted.
export function TopNav() {
  return (
    <Suspense fallback={<TopNavLinks pathname={null} />}>
      <TopNavActive />
    </Suspense>
  );
}

function TopNavActive() {
  return <TopNavLinks pathname={usePathname()} />;
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomNavLinks pathname={null} />}>
      <BottomNavActive />
    </Suspense>
  );
}

function BottomNavActive() {
  return <BottomNavLinks pathname={usePathname()} />;
}

function TopNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="hidden gap-1 md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(pathname, l.href) ? "page" : undefined}
          className={cx(
            "rounded-md px-3 py-2 text-sm font-semibold",
            isActive(pathname, l.href) ? "bg-stamp-soft text-stamp" : "text-muted hover:text-ink",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Thumb-reach tab bar for phones. */
function BottomNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {LINKS.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "relative px-0.5 py-3 text-center text-xs font-semibold",
              active ? "text-stamp" : "text-muted",
            )}
          >
            {active && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded bg-stamp" />}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
