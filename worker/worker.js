// Mearva Seafood — chat backend (Cloudflare Worker)
// ---------------------------------------------------------------------------
// Visitor -> widget.js (in index.html) -> POST /api/chat (this Worker)
//         -> Anthropic Messages API -> reply -> widget.
//
// The Anthropic API key lives ONLY in the Worker environment (secret).
// It is never present in index.html, widget.js, this file, or the repo.
//
// Deploy with wrangler. See wrangler.toml and README.md in this folder.
// ---------------------------------------------------------------------------

import { SYSTEM_PROMPT } from "./system-prompt.js";
import { KNOWLEDGE_BASE } from "./knowledge-base.js";

// --- Configuration ----------------------------------------------------------

// Browsers that may call this API. Requests from other origins get no CORS
// headers (the browser then blocks the response).
const ALLOWED_ORIGINS = [
  "https://mearvaseafood.com",
  "https://www.mearvaseafood.com",
];

// Default model. Override in wrangler.toml [vars] with MODEL if needed.
const DEFAULT_MODEL = "claude-sonnet-4-6";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const MAX_OUTPUT_TOKENS = 1024; // assistant replies are short by design
const MAX_HISTORY_MESSAGES = 20; // last N turns kept from the client
const MAX_MESSAGE_CHARS = 4000; // per-message input cap (abuse guard)

// Rate limiting: max requests per IP per rolling hour window.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

const SUPPORTED_LANGUAGES = ["en", "ar", "no"];

// --- Entry point ------------------------------------------------------------

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return json({ error: "Not found" }, 404, cors);
    }

    // Rate limit by client IP.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rl = await checkRateLimit(env, ip);
    if (!rl.ok) {
      return json(
        { error: "Rate limit exceeded. Please try again later." },
        429,
        { ...cors, "Retry-After": String(rl.retryAfter) },
      );
    }

    // Parse and validate the request body.
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400, cors);
    }

    const messages = sanitizeMessages(body && body.messages);
    if (!messages) {
      return json(
        { error: "Body must be { messages: [...], language }." },
        400,
        cors,
      );
    }

    const language = SUPPORTED_LANGUAGES.includes(body && body.language)
      ? body.language
      : "en";

    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Server is not configured." }, 500, cors);
    }

    const model = (env.MODEL && String(env.MODEL)) || DEFAULT_MODEL;

    // Build the Anthropic request. The stable system prompt + knowledge base
    // are cached (prompt caching); the small per-request language hint sits
    // after the cache breakpoint so it never invalidates the cache.
    const payload = {
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        {
          type: "text",
          text: KNOWLEDGE_BASE,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: languageHint(language) },
      ],
      messages,
    };

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ error: "Upstream request failed." }, 502, cors);
    }

    if (!upstream.ok) {
      // Do not leak upstream error internals to the browser.
      const detail = await upstream.text().catch(() => "");
      console.error("Anthropic error", upstream.status, detail);
      return json(
        { error: "The assistant is temporarily unavailable." },
        502,
        cors,
      );
    }

    const data = await upstream.json();
    const reply = extractText(data);

    return json({ reply }, 200, cors);
  },
};

// --- Helpers ----------------------------------------------------------------

function corsHeaders(origin) {
  const headers = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

// Fixed-window counter in KV. Degrades gracefully (allows the request) if no
// KV namespace is bound, so the Worker still runs before KV is configured.
async function checkRateLimit(env, ip) {
  if (!env.RATE_LIMIT) return { ok: true };
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `rl:${ip}:${bucket}`;
  const current = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
  if (current >= RATE_LIMIT_MAX) {
    const resetMs = (bucket + 1) * windowMs - Date.now();
    return { ok: false, retryAfter: Math.max(1, Math.ceil(resetMs / 1000)) };
  }
  await env.RATE_LIMIT.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2,
  });
  return { ok: true };
}

// Validate and normalize the client's message history:
// - array of { role: "user" | "assistant", content: string }
// - drop anything malformed, trim/cap content
// - keep only the last MAX_HISTORY_MESSAGES
// - must start with a user turn and be non-empty
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;

  const cleaned = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    if (typeof m.content !== "string") continue;
    const content = m.content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!content) continue;
    cleaned.push({ role: m.role, content });
  }

  const trimmed = cleaned.slice(-MAX_HISTORY_MESSAGES);
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();

  return trimmed.length ? trimmed : null;
}

function languageHint(language) {
  const names = { en: "English", ar: "Arabic", no: "Norwegian" };
  return (
    `The visitor's website language is currently set to ${names[language]}. ` +
    `Default to ${names[language]} unless the visitor clearly writes in ` +
    `another supported language (English, Arabic, or Norwegian), then match ` +
    `the visitor's language.`
  );
}

function extractText(data) {
  if (!data || !Array.isArray(data.content)) return "";
  return data.content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim();
}
