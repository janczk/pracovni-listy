import { NextResponse } from "next/server";
import { testGeminiConnection } from "@/services/geminiClient";

export async function GET() {
  try {
    const text = await testGeminiConnection();
    return NextResponse.json({ ok: true, text });
  } catch (error: unknown) {
    console.error("Gemini test failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Volání Gemini se nezdařilo. Zkontrolujte GEMINI_API_KEY a konzoli serveru.",
      },
      { status: 500 }
    );
  }
}

