import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

/**
 * Browsing and search are public: anyone with the link can look up a price,
 * no account needed. Only adding, editing and Settings require sign-in.
 */
function isProtectedPath(pathname: string) {
  return pathname.startsWith("/settings") || pathname.endsWith("/new") || pathname.endsWith("/edit");
}

/**
 * Optimistic check only: sends signed-out visitors to /login when they hit a
 * protected path. Real authorization happens in the data layer (lib/auth.ts)
 * and every Server Action.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/login";

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // A valid cookie on /login is allowed through: the account may have been
  // deactivated, and redirecting it back to / would loop.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)"],
};
