import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStatsWithUsers } from "@/lib/analyticsServer";
import { ANALYTICS_ALLOWED_BETA_CODE } from "@/lib/constants";

const BETA_COOKIE = "beta_access";

export async function GET() {
  const cookieStore = await cookies();
  const beta = cookieStore.get(BETA_COOKIE)?.value?.trim().toLowerCase();
  if (beta !== ANALYTICS_ALLOWED_BETA_CODE) {
    return NextResponse.json({ error: "Přístup odepřen." }, { status: 403 });
  }
  try {
    const stats = await getStatsWithUsers();
    const res = NextResponse.json(stats);
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (e) {
    console.error("analytics stats failed:", e);
    return NextResponse.json({ error: "Načtení statistik se nepodařilo." }, { status: 500 });
  }
}
