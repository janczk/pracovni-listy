import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANALYTICS_ALLOWED_BETA_CODE } from "@/lib/constants";

const BETA_COOKIE = "beta_access";

/**
 * Diagnostika úložiště statistik – jen pro beta-pl-001.
 * Vrací, zda je Redis nakonfigurován a které env proměnné jsou nastavené (bez hodnot).
 */
export async function GET() {
  const cookieStore = await cookies();
  const beta = cookieStore.get(BETA_COOKIE)?.value?.trim().toLowerCase();
  if (beta !== ANALYTICS_ALLOWED_BETA_CODE) {
    return NextResponse.json({ error: "Přístup odepřen." }, { status: 403 });
  }

  const envKeys = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
  ] as const;
  const env: Record<string, boolean> = {};
  for (const key of envKeys) {
    env[key] = !!(process.env[key] ?? (process as unknown as Record<string, string>)[key]);
  }

  const hasUpstash = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN;
  const hasKv = env.KV_REST_API_URL && env.KV_REST_API_TOKEN;
  const redisConfigured = hasUpstash || hasKv;

  let storageTest: "ok" | "error" | "skipped" = "skipped";
  let storageError: string | null = null;
  if (redisConfigured) {
    try {
      const { getStatsWithUsers } = await import("@/lib/analyticsServer");
      await getStatsWithUsers();
      storageTest = "ok";
    } catch (e) {
      storageTest = "error";
      storageError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    redisConfigured,
    storage: redisConfigured ? "redis" : "file",
    env,
    storageTest,
    storageError,
  });
}
