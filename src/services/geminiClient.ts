import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "[Gemini] Chybí proměnná GEMINI_API_KEY. Použijí se jen mock data."
  );
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Hlavní model, který budeme používat v aplikaci
const MODEL_NAME = "gemini-2.5-flash";

// Pomocná funkce pro získání modelu
export function getGeminiModel() {
  if (!genAI) {
    throw new Error("Gemini API není nakonfigurováno (chybí GEMINI_API_KEY).");
  }
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

// Jednoduchý testovací dotaz – můžeme ho použít později v konzoli
export async function testGeminiConnection() {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: "Napiš jednu krátkou větu česky." }],
      },
    ],
  });

  const response = result.response;
  return response.text();
}