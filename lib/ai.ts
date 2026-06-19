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

// Best Groq models in preference order (June 2026 — verified from console.groq.com/docs/models).
// Tried in sequence; falls through on 404 (model not on your plan/retired).
const GROQ_MODELS = [
  "openai/gpt-oss-120b",                        // best intelligence, 131k ctx — ideal for coaching plans
  "meta-llama/llama-4-scout-17b-16e-instruct",  // Llama 4 Scout — agentic, fast
  "llama-3.3-70b-versatile",                    // reliable workhorse fallback
  "llama-3.1-70b-versatile",                    // older fallback
];

async function callGroq(system: string, user: string, maxTokens: number): Promise<AIResult> {
  const override = (process.env.GROQ_MODEL || "").trim();
  const candidates = override ? [override, ...GROQ_MODELS] : GROQ_MODELS;

  let lastErr = "";
  for (const model of candidates) {
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
    if (res.ok) {
      const data = await res.json();
      return { ok: true, text: data.choices?.[0]?.message?.content ?? "", provider: "groq" };
    }
    const errText = await res.text();
    lastErr = `Groq ${res.status} (${model}): ${errText}`;
    // Only try the next model for 404 (unknown model) — other errors are real failures
    if (res.status !== 404) throw new Error(lastErr);
  }
  throw new Error(lastErr || "Groq: no usable model found.");
}

// Current Gemini models (v1beta generateContent). Tried in order; if one 404s
// (retired/renamed model), we fall through to the next.
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
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

import { z } from "zod";
import { DailyPlan, WeeklyReport } from "./types";

// ============================================================
// ZOD SCHEMAS — per-field validation with graceful fallback
// Each field is validated independently so a single bad field
// does not poison the entire AI response.
// ============================================================

const NonEmptyString = z.string().min(1);

const PlanSectionSchema = z.object({
  title: NonEmptyString,
  detail: z.string(),
});

const LegendStorySchema = z.object({
  legend: NonEmptyString,
  text: z.string(),
});

const BookCitationSchema = z.object({
  book: NonEmptyString,
  page: z.number(),
});

/** Validate one field and fall back to the local default on failure. */
function safeField<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

/** Merge an AI-parsed object over a local plan with per-field Zod validation.
 *  Any field that fails validation (wrong type, empty string, missing) falls
 *  back to the local scaffold so the user never sees a broken plan.
 */
export function mergeValidatedPlan(parsed: unknown, local: DailyPlan): DailyPlan {
  const p = parsed as Record<string, unknown>;
  if (!p || typeof p !== "object" || Array.isArray(p)) return local;
  return {
    ...local,
    greeting: safeField(NonEmptyString, p.greeting, local.greeting),
    verdictOnYesterday: safeField(NonEmptyString, p.verdictOnYesterday, local.verdictOnYesterday),
    focus: safeField(NonEmptyString, p.focus, local.focus),
    gym: safeField(PlanSectionSchema, p.gym, local.gym),
    maths: safeField(PlanSectionSchema, p.maths, local.maths),
    skincare: safeField(PlanSectionSchema, p.skincare, local.skincare),
    communication: safeField(PlanSectionSchema, p.communication, local.communication),
    mindset: safeField(PlanSectionSchema, p.mindset, local.mindset),
    legendStory: safeField(LegendStorySchema, p.legendStory, local.legendStory),
    message: safeField(NonEmptyString, p.message, local.message),
    bookCitations: Array.isArray(p.bookCitations)
      ? p.bookCitations
          .map((c) => safeField(BookCitationSchema, c, null))
          .filter((c): c is { book: string; page: number } => c !== null)
      : local.bookCitations,
  };
}

/** Merge an AI-parsed object over a local report with per-field Zod validation. */
export function mergeValidatedReport(parsed: unknown, local: WeeklyReport): WeeklyReport {
  const p = parsed as Record<string, unknown>;
  if (!p || typeof p !== "object" || Array.isArray(p)) return local;
  return {
    ...local,
    physical: safeField(NonEmptyString, p.physical, local.physical),
    mental: safeField(NonEmptyString, p.mental, local.mental),
    skills: safeField(NonEmptyString, p.skills, local.skills),
    legendChapter: safeField(NonEmptyString, p.legendChapter, local.legendChapter),
    verdict: safeField(NonEmptyString, p.verdict, local.verdict),
    nextWeekFocus: safeField(NonEmptyString, p.nextWeekFocus, local.nextWeekFocus),
  };
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
