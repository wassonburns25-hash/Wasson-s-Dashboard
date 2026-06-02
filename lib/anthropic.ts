import Anthropic from "@anthropic-ai/sdk";

/**
 * Returns an Anthropic client, or null if no API key is configured.
 * Callers should fall back to manual entry when this is null so the app
 * still works without the AI features turned on.
 */
export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// Haiku: fast and low-cost for calorie estimates, photo extraction, and
// outreach drafts. Bump to "claude-opus-4-8" if you want max quality.
export const AI_MODEL = "claude-haiku-4-5";

/** Pull the first text block out of a Messages response. */
export function firstText(content: Anthropic.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

/** Parse a JSON object out of model text, tolerating ```json fences. */
export function parseJsonObject<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
