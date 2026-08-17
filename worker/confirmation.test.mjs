// Tests for the customer-confirmation path (Phase 2E) + observability logging.
// Dependency-free: run with `node worker/confirmation.test.mjs` from the repo
// root (or `node confirmation.test.mjs` from worker/). Exits non-zero on failure.
//
// Covers: token/auth failure, Graph send failure, successful confirmation, the
// lead response staying successful when confirmation fails, and a log-safety
// assertion that no secret/PII value is ever written to the logs.

import worker from "./worker.js";
import {
  sendCustomerConfirmation,
  buildConfirmationEmail,
} from "./confirmation.js";

let pass = 0,
  fail = 0;

// --- Capture console.log so we can assert on the structured log lines the
// confirmation code emits. Our OWN test output uses realLog (emit/ck) so it is
// never captured and never pollutes the log-safety scan below. -----------------
const logLines = [];
const realLog = console.log;
console.log = (...a) => {
  logLines.push(a.map(String).join(" "));
};
const restoreLog = () => {
  console.log = realLog;
};
const emit = (...a) => realLog(...a); // for our own test output
const ck = (n, c, x) =>
  c
    ? (pass++, emit("  PASS", n))
    : (fail++, emit("  FAIL", n, x !== undefined ? JSON.stringify(x) : ""));

// --- Mock fetch: route web3forms / MS token / MS graph sendMail --------------
let calls = { web3: 0, token: 0, graph: 0 };
let web3Success = true;
let tokenStatus = 200; // 200 => returns access_token; else token endpoint fails
let graphStatus = 202; // 202 => sent ok; else send_failed
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  u = String(u);
  if (u.includes("api.web3forms.com")) {
    calls.web3++;
    return new Response(JSON.stringify({ success: web3Success }), { status: 200 });
  }
  if (u.includes("login.microsoftonline.com")) {
    calls.token++;
    if (tokenStatus !== 200) return new Response("", { status: tokenStatus });
    return new Response(JSON.stringify({ access_token: "SECRET_TOKEN_VALUE" }), {
      status: 200,
    });
  }
  if (u.includes("graph.microsoft.com")) {
    calls.graph++;
    return new Response("", { status: graphStatus });
  }
  return realFetch(u, o);
};

// Secrets/PII that must NEVER appear in any log line.
const SENSITIVE = {
  clientSecret: "SUPER_SECRET_CLIENT_VALUE",
  tenantId: "11111111-2222-3333-4444-555555555555",
  clientId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  token: "SECRET_TOKEN_VALUE",
  senderLocal: "no-reply", // MS_SENDER address must not be logged
  buyerEmail: "buyer@example.com",
};

const MS_ENV = {
  WEB3FORMS_KEY: "k",
  CONFIRMATION_ENABLED: "true",
  MS_TENANT_ID: SENSITIVE.tenantId,
  MS_CLIENT_ID: SENSITIVE.clientId,
  MS_CLIENT_SECRET: SENSITIVE.clientSecret,
  MS_SENDER: "no-reply@mearvaseafood.com",
};
const lead = {
  name: "Test",
  company: "Co",
  email: SENSITIVE.buyerEmail,
  country: "SA",
  destination: "Riyadh",
  product: "Fresh salmon",
  volume: "500 kg",
};
const req = (b) =>
  new Request("https://x/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://mearvaseafood.com" },
    body: JSON.stringify(b),
  });

const resetState = () => {
  calls = { web3: 0, token: 0, graph: 0 };
  web3Success = true;
  tokenStatus = 200;
  graphStatus = 202;
};
const lastLog = () => {
  try {
    return JSON.parse(logLines[logLines.length - 1]);
  } catch {
    return {};
  }
};

// ---- Unit: successful confirmation ------------------------------------------
emit("== unit: successful confirmation ==");
resetState();
let r1 = await sendCustomerConfirmation(lead, "ar", MS_ENV);
ck("configured + 202 -> sent", r1.sent === true && r1.reason === "ok", r1);
ck("token + graph were called once", calls.token === 1 && calls.graph === 1, calls);
ck('logs event "sent" with status 202', lastLog().event === "customer_confirmation" && lastLog().reason === "sent" && lastLog().status === 202, lastLog());
ck("AR body keeps receipt-only disclaimer", buildConfirmationEmail(lead, "ar").body.includes("ولا تُعدّ تأكيدًا للسعر"));

// ---- Unit: token / auth failure ---------------------------------------------
emit("\n== unit: token/auth failure ==");
resetState();
tokenStatus = 401; // bad client secret
let r2 = await sendCustomerConfirmation(lead, "en", MS_ENV);
ck("token fail -> not sent, reason auth_failed", r2.sent === false && r2.reason === "auth_failed", r2);
ck("graph NOT called when token fails", calls.graph === 0, calls);
ck('logs "token_failed" with status 401', logLines.some((l) => l.includes('"token_failed"') && l.includes("401")));
ck('logs "auth_failed"', logLines.some((l) => l.includes('"auth_failed"')));

// ---- Unit: Graph send failure -----------------------------------------------
emit("\n== unit: Graph send failure ==");
resetState();
graphStatus = 403; // e.g. RBAC propagation
let r3 = await sendCustomerConfirmation(lead, "en", MS_ENV);
ck("graph 403 -> not sent, reason send_failed_403", r3.sent === false && r3.reason === "send_failed_403", r3);
ck('logs "send_failed" with status 403', logLines.some((l) => l.includes('"send_failed"') && l.includes("403")));

// ---- Integration: lead stays successful even if confirmation fails ----------
emit("\n== integration: lead success is independent of confirmation ==");
resetState();
graphStatus = 500; // confirmation will fail
let scheduled = [];
let ctx = { waitUntil: (p) => scheduled.push(p) };
let lr = await worker.fetch(req({ lead, language: "en" }), MS_ENV, ctx);
let lj = await lr.json();
ck("lead -> 200 ok:true despite confirmation failure", lr.status === 200 && lj.ok === true, lj);
ck("confirmation scheduled via waitUntil", scheduled.length === 1);
await Promise.all(scheduled);
ck("graph attempted once (and failed)", calls.graph === 1, calls);
ck("lead delivered to web3forms", calls.web3 === 1);

// ---- Integration: NO confirmation when lead delivery FAILS ------------------
emit("\n== integration: no confirmation when lead delivery fails ==");
resetState();
web3Success = false;
scheduled = [];
lr = await worker.fetch(req({ lead, language: "en" }), MS_ENV, { waitUntil: (p) => scheduled.push(p) });
lj = await lr.json();
ck("lead failure -> 502 ok:false", lr.status === 502 && lj.ok === false, lj);
ck("NO confirmation scheduled on lead failure", scheduled.length === 0);
ck("graph NOT called on lead failure", calls.graph === 0, calls);

// ---- Log safety: never leak secrets or PII ----------------------------------
emit("\n== log safety: no secret/PII in any log line ==");
const allLogs = logLines.join("\n");
for (const [k, v] of Object.entries(SENSITIVE)) {
  ck(`logs never contain ${k}`, !allLogs.includes(v), k);
}
ck("logs never contain a full sender/customer email address", !/@mearvaseafood\.com|@example\.com/.test(allLogs));

restoreLog();
emit("\nRESULT:", pass, "passed,", fail, "failed");
process.exit(fail ? 1 : 0);
