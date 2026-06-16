// ============================================================
// SERVER-SIDE AI CLIENT — provider agnostic.
// Supports Groq, Google Gemini, Anthropic Claude.
// Selected by AI_PROVIDER or auto-detected from whichever key is set.
// Keys live in .env (server only) — never shipped to the client.
// ============================================================

export type Provider = "groq" | "gemini" | "anthropic";

export function detectProvider(): Provider | null {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  if (explicit === "groq" || explicit === "gemini" || explicit === "anthropic") {
    return explicit as Provider;
  }
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export interface AIResult {
  ok: boolean;
  text: string;
  provider: Provider | null;
  error?: string;
}

export async function callAI(system: string, user: string, maxTokens = 2000): Promise<AIResult> {
  const provider = detectProvider();
  if (!provider) return { ok: false, text: "", provider: null, error: "No AI provider key configured." };

  try {
    if (provider === "groq") return await callGroq(system, user, maxTokens);
    if (provider === "gemini") return await callGemini(system, user, maxTokens);
    if (provider === "anthropic") return await callAnthropic(system, user, maxTokens);
  } catch (e: any) {
    return { ok: false, text: "", provider, error: e?.message || String(e) };
  }
  return { ok: false, text: "", provider, error: "Unknown provider." };
}

async function callGroq(system: string, user: string, maxTokens: number): Promise<AIResult> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.85,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { ok: true, text: data.choices?.[0]?.message?.content ?? "", provider: "groq" };
}

// Current Gemini models (v1beta generateContent). Tried in order; if one 404s
// (retired/renamed model, e.g. the old gemini-1.5-flash), we fall through to the next.
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-001",
];

async function callGemini(system: string, user: string, maxTokens: number): Promise<AIResult> {
  // Honour an explicit override first, then the known-good fallback chain.
  const override = (process.env.GEMINI_MODEL || "").trim();
  const candidates = override ? [override, ...GEMINI_MODELS] : GEMINI_MODELS;

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: maxTokens },
  });

  let lastErr = "";
  for (const model of candidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      return { ok: true, text, provider: "gemini" };
    }
    const errText = await res.text();
    lastErr = `Gemini ${res.status} (${model}): ${errText}`;
    // Only try the next model when this one is missing/unsupported; otherwise stop.
    if (res.status !== 404) throw new Error(lastErr);
  }
  throw new Error(lastErr || "Gemini: no usable model found.");
}

async function callAnthropic(system: string, user: string, maxTokens: number): Promise<AIResult> {
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.85,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.map((c: any) => c.text).join("") ?? "";
  return { ok: true, text, provider: "anthropic" };
}

// Extract the first JSON object from a model response (handles ```json fences).
export function extractJSON(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}
