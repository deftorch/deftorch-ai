import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { guestRegex } from "./lib/constants";
import { authConfig } from "./app/(auth)/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = req.auth;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!session) {
    const redirectUrl = encodeURIComponent(new URL(req.url).pathname);

    return NextResponse.redirect(
      new URL(`${base}/api/auth/guest?redirectUrl=${redirectUrl}`, req.url)
    );
  }

  const isGuest = guestRegex.test(session.user?.email ?? "");

  if (session && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL(`${base}/`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
