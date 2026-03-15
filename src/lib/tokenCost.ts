/** Výchozí ceny Gemini 2.5 Flash Lite (USD za 1M tokenů). Lze přepsat env na serveru. */
export const DEFAULT_INPUT_PRICE_PER_1M = 0.1;
export const DEFAULT_OUTPUT_PRICE_PER_1M = 0.4;

/** Odhad ceny v USD na serveru (respektuje GEMINI_INPUT_PRICE_PER_1M, GEMINI_OUTPUT_PRICE_PER_1M). */
export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  const inP =
    typeof process !== "undefined" && process.env?.GEMINI_INPUT_PRICE_PER_1M != null
      ? Number(process.env.GEMINI_INPUT_PRICE_PER_1M)
      : DEFAULT_INPUT_PRICE_PER_1M;
  const outP =
    typeof process !== "undefined" && process.env?.GEMINI_OUTPUT_PRICE_PER_1M != null
      ? Number(process.env.GEMINI_OUTPUT_PRICE_PER_1M)
      : DEFAULT_OUTPUT_PRICE_PER_1M;
  return (inputTokens / 1_000_000) * inP + (outputTokens / 1_000_000) * outP;
}

/** Odhad ceny v USD na klientu (výchozí ceny nebo předané). */
export function estimateCostUsdClient(
  inputTokens: number,
  outputTokens: number,
  inputPricePer1M = DEFAULT_INPUT_PRICE_PER_1M,
  outputPricePer1M = DEFAULT_OUTPUT_PRICE_PER_1M
): number {
  return (inputTokens / 1_000_000) * inputPricePer1M + (outputTokens / 1_000_000) * outputPricePer1M;
}
