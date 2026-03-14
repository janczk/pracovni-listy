import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Typy
export type DailyStats = { generated: number; basicAndLmp: number; basicAndSvp: number };
export type StatsByDate = Record<string, DailyStats>;
export type RecordPayload = { generated?: number; basicAndLmp?: number; basicAndSvp?: number };

/** Celá uložená struktura: celkové statistiky + podle beta uživatelů. */
export type StatsPayload = { overall: StatsByDate; byUser: Record<string, StatsByDate> };

const FILENAME = "usage-stats.json";
const KV_KEY = "usage-stats";
const defaultDay: DailyStats = { generated: 0, basicAndLmp: 0, basicAndSvp: 0 };

function getDataPath(): string {
  return join(process.cwd(), "data", FILENAME);
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureDay(stats: StatsByDate, dateKey: string): DailyStats {
  if (!stats[dateKey]) stats[dateKey] = { ...defaultDay };
  return stats[dateKey];
}

function normalizePayload(parsed: unknown): StatsPayload {
  if (parsed && typeof parsed === "object" && "overall" in parsed && "byUser" in parsed) {
    const p = parsed as StatsPayload;
    return {
      overall: typeof p.overall === "object" && p.overall !== null ? p.overall : {},
      byUser: typeof p.byUser === "object" && p.byUser !== null ? p.byUser : {},
    };
  }
  // Starý formát: celý objekt = overall podle dat
  const asByDate = parsed as StatsByDate;
  return {
    overall: typeof asByDate === "object" && asByDate !== null ? asByDate : {},
    byUser: {},
  };
}

function useRedis(): boolean {
  const upstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  return !!(upstash || kv);
}

async function getRedisClient() {
  const { Redis } = await import("@upstash/redis");
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return new Redis({ url, token });
  return Redis.fromEnv();
}

async function readPayloadFromRedis(): Promise<StatsPayload> {
  const redis = await getRedisClient();
  const raw = await redis.get<string>(KV_KEY);
  if (raw == null || typeof raw !== "string") return { overall: {}, byUser: {} };
  try {
    const data = JSON.parse(raw) as unknown;
    return normalizePayload(data);
  } catch {
    return { overall: {}, byUser: {} };
  }
}

async function writePayloadToRedis(payload: StatsPayload): Promise<void> {
  const redis = await getRedisClient();
  await redis.set(KV_KEY, JSON.stringify(payload));
}

async function readPayloadFromFile(): Promise<StatsPayload> {
  try {
    const path = getDataPath();
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw) as unknown;
    return normalizePayload(data);
  } catch {
    return { overall: {}, byUser: {} };
  }
}

async function writePayloadToFile(payload: StatsPayload): Promise<void> {
  const dir = join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, FILENAME), JSON.stringify(payload, null, 2), "utf-8");
}

async function readPayload(): Promise<StatsPayload> {
  if (useRedis()) return readPayloadFromRedis();
  return readPayloadFromFile();
}

async function writePayload(payload: StatsPayload): Promise<boolean> {
  if (useRedis()) {
    try {
      await writePayloadToRedis(payload);
      return true;
    } catch (err) {
      console.error("analytics: failed to write stats to Redis", err);
      return false;
    }
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "analytics: Redis není nakonfigurován (UPSTASH_REDIS_REST_URL/TOKEN). Na Vercelu se statistiky neukládají – přidejte Upstash Redis."
    );
  }
  try {
    await writePayloadToFile(payload);
    return true;
  } catch (err) {
    console.error("analytics: failed to write stats file", err);
    return false;
  }
}

/**
 * Přičte záznam k dnešnímu dni (celkem i pro beta uživatele) a uloží.
 * Volá se z API (from-topic, from-textbook, record). betaUserId = hodnota cookie beta_access (např. beta-pl-001).
 */
export async function recordGeneration(payload: RecordPayload, betaUserId?: string): Promise<void> {
  const data = await readPayload();
  const dateKey = getTodayKey();

  const dayOverall = ensureDay(data.overall, dateKey);
  if (payload.generated != null) dayOverall.generated += payload.generated;
  if (payload.basicAndLmp != null) dayOverall.basicAndLmp += payload.basicAndLmp;
  if (payload.basicAndSvp != null) dayOverall.basicAndSvp += payload.basicAndSvp;

  if (betaUserId && betaUserId.trim()) {
    const uid = betaUserId.trim().toLowerCase();
    if (!data.byUser[uid]) data.byUser[uid] = {};
    const dayUser = ensureDay(data.byUser[uid], dateKey);
    if (payload.generated != null) dayUser.generated += payload.generated;
    if (payload.basicAndLmp != null) dayUser.basicAndLmp += payload.basicAndLmp;
    if (payload.basicAndSvp != null) dayUser.basicAndSvp += payload.basicAndSvp;
  }

  const ok = await writePayload(data);
  if (!ok && process.env.NODE_ENV === "production") {
    console.error("analytics: záznam se neuložil – zkontrolujte Redis na Vercelu (env UPSTASH_*).");
  }
}

/**
 * Vrátí statistiky celkové i podle uživatelů pro stránku /analytics.
 */
export async function getStatsWithUsers(): Promise<StatsPayload> {
  return readPayload();
}
