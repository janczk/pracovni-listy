import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordGeneration } from "@/lib/analyticsServer";

const BETA_COOKIE = "beta_access";

export type RecordBody = {
  generated?: number;
  basicAndLmp?: number;
  basicAndSvp?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecordBody;
    const payload = {
      generated: typeof body.generated === "number" ? body.generated : undefined,
      basicAndLmp: typeof body.basicAndLmp === "number" ? body.basicAndLmp : undefined,
      basicAndSvp: typeof body.basicAndSvp === "number" ? body.basicAndSvp : undefined,
      inputTokens: typeof body.inputTokens === "number" ? body.inputTokens : undefined,
      outputTokens: typeof body.outputTokens === "number" ? body.outputTokens : undefined,
    };
    const hasAny =
      payload.generated !== undefined ||
      payload.basicAndLmp !== undefined ||
      payload.basicAndSvp !== undefined ||
      payload.inputTokens !== undefined ||
      payload.outputTokens !== undefined;
    if (!hasAny) return NextResponse.json({ ok: true });
    const cookieStore = await cookies();
    const betaUserId = cookieStore.get(BETA_COOKIE)?.value;
    await recordGeneration(payload, betaUserId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("analytics record failed:", e);
    return NextResponse.json({ error: "Záznam se nepodařil." }, { status: 500 });
  }
}
