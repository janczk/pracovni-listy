import { NextResponse } from "next/server";

const BETA_COOKIE = "beta_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dní

export async function POST(req: Request) {
  let body: { code?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  // Honeypot: pokud je vyplněné skryté pole (bot), odmítneme
  if (body.website && String(body.website).trim() !== "") {
    return NextResponse.json({ error: "Přístup odepřen." }, { status: 400 });
  }

  const codesEnv = process.env.BETA_CODES;
  if (!codesEnv || codesEnv.trim() === "") {
    return NextResponse.json({ error: "Beta přístup není nakonfigurován." }, { status: 503 });
  }

  const code = (body.code ?? "").trim();
  const allowedCodes = codesEnv.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);

  if (!allowedCodes.includes(code.toLowerCase())) {
    return NextResponse.json({ error: "Neplatný beta kód." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const isProduction = process.env.NODE_ENV === "production";
  res.cookies.set(BETA_COOKIE, code, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return res;
}
