import { NextResponse } from "next/server";

const BETA_COOKIE = "beta_access";

/**
 * Zruší cookie beta_access a přesměruje na /beta.
 */
function logoutResponse(request: Request) {
  const url = new URL(request.url);
  const base = url.origin;
  const res = NextResponse.redirect(new URL("/beta", base));
  res.cookies.set(BETA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET(request: Request) {
  return logoutResponse(request);
}

export async function POST(request: Request) {
  return logoutResponse(request);
}
