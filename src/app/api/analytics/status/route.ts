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
  let writeTest: "ok" | "error" | "skipped" = "skipped";
  let writeError: string | null = null;

  let dataSummary: { dates: number; users: number; totalGenerated: number } | null = null;
  let usageStatsKey: "missing" | "empty" | number = "missing";

  if (redisConfigured) {
    try {
      const { Redis } = await import("@upstash/redis");
      const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
      const redis = url && token ? new Redis({ url, token }) : Redis.fromEnv();
      try {
        const raw = await redis.get("usage-stats");
        if (raw == null) usageStatsKey = "missing";
        else if (typeof raw === "string") usageStatsKey = raw.length || "empty";
        else usageStatsKey = JSON.stringify(raw).length;
      } catch {
        usageStatsKey = "missing";
      }

      const { getStatsWithUsers } = await import("@/lib/analyticsServer");
      const payload = await getStatsWithUsers();
      storageTest = "ok";
      const totalGenerated = Object.values(payload.overall).reduce((s, d) => s + (d?.generated ?? 0), 0);
      dataSummary = {
        dates: Object.keys(payload.overall).length,
        users: Object.keys(payload.byUser).length,
        totalGenerated,
      };
    } catch (e) {
      storageTest = "error";
      storageError = e instanceof Error ? e.message : String(e);
    }

    // Test zápisu – pokud selže, může být nastaven jen read-only token
    try {
      const { Redis } = await import("@upstash/redis");
      const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
      const redis = url && token ? new Redis({ url, token }) : Redis.fromEnv();
      const testKey = "analytics-status-write-test";
      await redis.set(testKey, "ok");
      const v = await redis.get(testKey);
      await redis.del(testKey);
      writeTest = v === "ok" ? "ok" : "error";
      if (writeTest === "error") writeError = "Čtení po zápisu nevrátilo očekávanou hodnotu.";
    } catch (e) {
      writeTest = "error";
      writeError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    redisConfigured,
    storage: redisConfigured ? "redis" : "file",
    env,
    storageTest,
    storageError,
    writeTest,
    writeError,
    dataSummary,
    usageStatsKey,
  });
}
