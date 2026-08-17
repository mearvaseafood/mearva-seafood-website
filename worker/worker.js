// Mearva Seafood — chat + lead backend (Cloudflare Worker)
// ---------------------------------------------------------------------------
// Visitor -> widget.js (in index.html)
//   POST /api/chat  -> Anthropic Messages API -> reply -> widget
//   POST /api/lead  -> validate + Web3Forms    -> sales@mearvaseafood.com
//
// Secrets live ONLY in the Worker environment (never in index.html, widget.js,
// this file, or the repo):
//   ANTHROPIC_API_KEY  — Anthropic key
//   WEB3FORMS_KEY      — Web3Forms access key (delivers to sales@mearvaseafood.com)
//
// Deploy with wrangler. See wrangler.toml and README.md in this folder.
// ---------------------------------------------------------------------------

import { SYSTEM_PROMPT } from "./system-prompt.js";
import { KNOWLEDGE_BASE } from "./knowledge-base.js";
import { sendCustomerConfirmation } from "./confirmation.js";

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
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const MAX_OUTPUT_TOKENS = 1024; // assistant replies are short by design
const MAX_HISTORY_MESSAGES = 20; // last N turns kept from the client
const MAX_MESSAGE_CHARS = 4000; // per-message input cap (abuse guard)

// Rate limiting (per IP, rolling hour window).
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const CHAT_RATE_LIMIT_MAX = 20;
const LEAD_RATE_LIMIT_MAX = 5; // lead submissions are stricter

const SUPPORTED_LANGUAGES = ["en", "ar", "no"];

// Per-field length caps for lead data (defence against oversized payloads).
const LEAD_CAPS = {
  name: 120,
  company: 160,
  email: 160,
  country: 80,
  destination: 160,
  product: 160,
  freshFrozen: 40,
  volume: 120,
  timing: 120,
  notes: 1500,
};

// --- Entry point ------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    if (request.method === "POST" && url.pathname === "/api/chat") {
      return handleChat(request, env, cors, ip);
    }
    if (request.method === "POST" && url.pathname === "/api/lead") {
      return handleLead(request, env, cors, ip, ctx);
    }
    return json({ error: "Not found" }, 404, cors);
  },
};

// --- /api/chat --------------------------------------------------------------

async function handleChat(request, env, cors, ip) {
  const rl = await checkRateLimit(env, ip, "rl", CHAT_RATE_LIMIT_MAX);
  if (!rl.ok) {
    return json({ error: "Rate limit exceeded. Please try again later." }, 429, {
      ...cors,
      "Retry-After": String(rl.retryAfter),
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, cors);
  }

  const messages = sanitizeMessages(body && body.messages);
  if (!messages) {
    return json({ error: "Body must be { messages: [...], language }." }, 400, cors);
  }

  const language = SUPPORTED_LANGUAGES.includes(body && body.language)
    ? body.language
    : "en";

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "Server is not configured." }, 500, cors);
  }

  const model = (env.MODEL && String(env.MODEL)) || DEFAULT_MODEL;

  // Stable system prompt + knowledge base are cached (prompt caching); the
  // small per-request language hint sits after the cache breakpoint.
  const payload = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      { type: "text", text: KNOWLEDGE_BASE, cache_control: { type: "ephemeral" } },
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
    const detail = await upstream.text().catch(() => "");
    console.error("Anthropic error", upstream.status, detail);
    return json({ error: "The assistant is temporarily unavailable." }, 502, cors);
  }

  const data = await upstream.json();
  return json({ reply: extractText(data) }, 200, cors);
}

// --- /api/lead --------------------------------------------------------------
// Validates, sanitizes and forwards a structured B2B enquiry to the existing
// Web3Forms destination (sales@mearvaseafood.com). Returns { ok: true } only
// when Web3Forms confirms delivery, so the widget can truthfully say "sent".

async function handleLead(request, env, cors, ip, ctx) {
  const rl = await checkRateLimit(env, ip, "ll", LEAD_RATE_LIMIT_MAX);
  if (!rl.ok) {
    return json({ ok: false, error: "rate_limited" }, 429, {
      ...cors,
      "Retry-After": String(rl.retryAfter),
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400, cors);
  }

  const raw = (body && body.lead) || {};
  const lead = {
    name: clean(raw.name, LEAD_CAPS.name),
    company: clean(raw.company, LEAD_CAPS.company),
    email: clean(raw.email, LEAD_CAPS.email),
    country: clean(raw.country, LEAD_CAPS.country),
    destination: clean(raw.destination, LEAD_CAPS.destination),
    product: clean(raw.product, LEAD_CAPS.product),
    freshFrozen: clean(raw.freshFrozen, LEAD_CAPS.freshFrozen),
    volume: clean(raw.volume, LEAD_CAPS.volume),
    timing: clean(raw.timing, LEAD_CAPS.timing),
    notes: cleanMultiline(raw.notes, LEAD_CAPS.notes),
  };

  // Server-side validation — reject empty / malformed submissions.
  const problems = [];
  if (!lead.name) problems.push("name");
  if (!lead.company) problems.push("company");
  if (!validEmail(lead.email)) problems.push("email");
  if (!lead.country) problems.push("country");
  if (!lead.destination) problems.push("destination");
  if (!lead.product) problems.push("product");
  if (!lead.volume) problems.push("volume");
  if (problems.length) {
    return json({ ok: false, error: "validation", fields: problems }, 400, cors);
  }

  if (!env.WEB3FORMS_KEY) {
    console.error("WEB3FORMS_KEY is not configured");
    return json({ ok: false, error: "not_configured" }, 500, cors);
  }

  const timestamp = new Date().toISOString();

  // Marketing consent — separate from the enquiry, defaults to NO. Only an
  // explicit "yes" counts; everything else is recorded as NO.
  const consentYes = body && body.marketing_consent === "yes";
  const consentLabel = consentYes ? "YES" : "NO";
  // Explicit allowlist — never classify an unknown source as Ask Mearva.
  const rawSource = clean(body && body.marketing_consent_source, 40);
  const consentSource =
    rawSource === "website_quote_form"
      ? "Website Quote Form"
      : rawSource === "ask_mearva"
        ? "Ask Mearva"
        : "Unknown";
  // Authoritative consent timestamp is ALWAYS generated server-side. The
  // client-supplied value is never trusted as the official record; it is kept
  // separately and clearly labelled as client-reported (diagnostic only).
  const consentTimestamp = new Date().toISOString();
  const consentTimestampClient = clean(body && body.marketing_consent_timestamp, 40) || "—";
  const consentLanguage = clean(body && body.marketing_consent_language, 8) || "—";

  const summary = [
    `Source: Ask Mearva AI Assistant`,
    `Name: ${lead.name}`,
    `Company: ${lead.company}`,
    `Email: ${lead.email}`,
    `Country: ${lead.country}`,
    `Destination: ${lead.destination}`,
    `Product: ${lead.product}`,
    `Fresh/Frozen: ${lead.freshFrozen || "—"}`,
    `Approximate Volume: ${lead.volume}`,
    `Timing: ${lead.timing || "—"}`,
    `Requirement Summary: ${lead.notes || "—"}`,
    ``,
    `Marketing Consent: ${consentLabel}`,
    `Consent Source: ${consentSource}`,
    `Consent Timestamp: ${consentTimestamp}`,
    `Consent Timestamp (client-reported): ${consentTimestampClient}`,
    `Submitted: ${timestamp}`,
  ].join("\n");

  const web3Payload = {
    access_key: env.WEB3FORMS_KEY,
    subject: "New AI Quote Lead — Mearva Seafood",
    from_name: "Ask Mearva AI Assistant",
    replyto: lead.email,
    Source: "Ask Mearva AI Assistant",
    Name: lead.name,
    Company: lead.company,
    Email: lead.email,
    Country: lead.country,
    Destination: lead.destination,
    Product: lead.product,
    "Fresh/Frozen": lead.freshFrozen || "—",
    "Approximate Volume": lead.volume,
    Timing: lead.timing || "—",
    "Requirement Summary": lead.notes || "—",
    "Marketing Consent": consentLabel,
    "Consent Source": consentSource,
    "Consent Timestamp": consentTimestamp,
    "Consent Timestamp (client-reported)": consentTimestampClient,
    "Consent Language": consentLanguage,
    Submitted: timestamp,
    message: summary,
  };

  let ok = false;
  try {
    const resp = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify(web3Payload),
    });
    const result = await resp.json().catch(() => ({}));
    ok = resp.ok && result && result.success === true;
    if (!ok) console.error("Web3Forms rejected lead", resp.status, JSON.stringify(result));
  } catch (e) {
    console.error("Web3Forms request failed", String(e));
  }

  if (!ok) {
    // Never leak upstream error internals to the browser.
    return json({ ok: false, error: "send_failed" }, 502, cors);
  }

  // Phase 2E: best-effort customer confirmation — ONLY after a confirmed
  // successful lead delivery. Fully isolated: it never affects the lead result
  // and never delays the response (runs in the background via waitUntil). It is
  // a no-op unless the Microsoft 365 channel is configured (see confirmation.js).
  const confLang = SUPPORTED_LANGUAGES.includes(body && body.language)
    ? body.language
    : "en";
  const confirmation = sendCustomerConfirmation(lead, confLang, env).catch(() => {});
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(confirmation);

  return json({ ok: true }, 200, cors);
}

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
async function checkRateLimit(env, ip, prefix, max) {
  if (!env.RATE_LIMIT) return { ok: true };
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `${prefix}:${ip}:${bucket}`;
  const current = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
  if (current >= max) {
    const resetMs = (bucket + 1) * windowMs - Date.now();
    return { ok: false, retryAfter: Math.max(1, Math.ceil(resetMs / 1000)) };
  }
  await env.RATE_LIMIT.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2,
  });
  return { ok: true };
}

// Single-line field: strip angle brackets (no HTML), control chars, collapse
// whitespace, cap length.
function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[<>]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, max);
}

// Multiline field: same, but preserve newlines.
function cleanMultiline(value, max) {
  return String(value == null ? "" : value)
    .replace(/[<>]/g, "")
    .replace(/\r/g, "")
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

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
