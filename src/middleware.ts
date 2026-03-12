import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BETA_COOKIE = "beta_access";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Bránu a API pro ověření vždy povolit
  if (path === "/beta" || path === "/api/beta-verify") {
    return NextResponse.next();
  }
  // Statické assety a Next.js interní cesty
  if (path.startsWith("/_next") || path.startsWith("/fonts") || path.includes(".")) {
    return NextResponse.next();
  }

  const codesEnv = process.env.BETA_CODES;
  // Na lokále bez BETA_CODES bránu nepoužívat
  if (!codesEnv || codesEnv.trim() === "") {
    return NextResponse.next();
  }

  const allowedCodes = codesEnv.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  const cookieValue = request.cookies.get(BETA_COOKIE)?.value?.trim().toLowerCase();

  if (cookieValue && allowedCodes.includes(cookieValue)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/beta", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
