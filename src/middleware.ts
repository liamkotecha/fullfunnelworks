import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — allow through
  const publicPaths = ["/login", "/verify", "/api/auth", "/api/webhooks"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Edge-compatible JWT check (no mongoose)
  const isSecure = req.url.startsWith("https");
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookieName,
    salt: cookieName,
  });

  // DEV BYPASS — remove before production
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  // If no session, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based redirect on root
  if (pathname === "/") {
    const role = (token as { role?: string }).role;
    if (role === "admin" || role === "consultant") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/portal/overview", req.url));
  }

  // Block clients from admin routes
  const role = (token as { role?: string }).role;
  if (pathname.startsWith("/admin") && role !== "admin" && role !== "consultant") {
    return NextResponse.redirect(new URL("/portal/overview", req.url));
  }

  // Block admins from portal routes (optional — remove if admins should access)
  // if (pathname.startsWith("/portal") && (role === "admin" || role === "consultant")) {
  //   return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
