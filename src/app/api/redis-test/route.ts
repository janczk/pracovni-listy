import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

function getRedis() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return new Redis({ url, token });
  return Redis.fromEnv();
}

export const POST = async () => {
  try {
    const redis = getRedis();
    const result = await redis.get("item");
    return NextResponse.json({ result }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
};

export const GET = POST;
