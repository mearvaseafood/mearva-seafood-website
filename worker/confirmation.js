// Mearva Seafood — customer confirmation email (Phase 2E scaffolding, INACTIVE).
// ---------------------------------------------------------------------------
// Purpose: after a customer completes a qualified enquiry, provides their email,
// and explicitly confirms submission, send them an automatic acknowledgement —
// but ONLY after /api/lead has already successfully delivered the lead to Sales.
//
// SAFETY / ISOLATION (why this is a separate module):
// - It must run AFTER a confirmed successful lead delivery, never before.
// - It is best-effort and fully isolated: a failure here must NOT affect the
//   lead result the customer already received. The caller (Phase 2B/2C wiring)
//   will invoke it in a try/catch and ignore its outcome for the lead status.
// - It NEVER claims receipt if the lead was not delivered.
// - It NEVER includes invented availability, prices, delivery promises, or legal
//   guarantees — only a receipt acknowledgement + the known enquiry summary.
//
// SENDING IS NOT YET POSSIBLE ON CURRENT INFRA:
// - The site's Web3Forms setup delivers the lead TO Sales, but a customer
//   autoresponder (email back to the visitor) is a paid Web3Forms feature and
//   is not configured. This module therefore returns a no-op until a channel
//   is explicitly configured. Do NOT add a provider or secret automatically.
//   Options for later (business decision): (A) Web3Forms PRO autoresponder,
//   (B) a transactional email provider (e.g. Resend / Postmark / MailChannels)
//   which needs a new Worker secret, or (C) Microsoft 365 SMTP + secret.
//
// This file is scaffolding: it is NOT imported by worker.js yet.
// ---------------------------------------------------------------------------

const SALES_EMAIL = "sales@mearvaseafood.com";
const WEBSITE = "https://mearvaseafood.com";

function line(label, value) {
  return value ? `${label}: ${value}\n` : "";
}

// Pure function: compose the acknowledgement email. No side effects, no invented
// data — only fields that are actually present are summarised.
export function buildConfirmationEmail(lead, language) {
  lead = lead || {};
  const lang = ["en", "ar", "no"].includes(language) ? language : "en";

  const summaryEn =
    line("Product", lead.product) +
    line("Fresh/Frozen", lead.freshFrozen) +
    line("Approximate volume", lead.volume) +
    line("Destination", lead.destination);
  const summaryAr =
    line("المنتج", lead.product) +
    line("طازج/مجمد", lead.freshFrozen) +
    line("الكمية التقريبية", lead.volume) +
    line("الوجهة", lead.destination);
  const summaryNo =
    line("Produkt", lead.product) +
    line("Fersk/Fryst", lead.freshFrozen) +
    line("Omtrentlig mengde", lead.volume) +
    line("Destinasjon", lead.destination);

  const T = {
    en: {
      subject: "We received your enquiry — Mearva Seafood",
      body:
        "Thank you for contacting Mearva Seafood.\n\n" +
        "We have received your seafood enquiry.\n\n" +
        (summaryEn ? summaryEn + "\n" : "") +
        "Our sales team will review product availability, specifications and " +
        "logistics, and will get back to you.\n\n" +
        "This email confirms receipt of your enquiry only. It does not " +
        "constitute a price, availability, freight or delivery confirmation.\n\n" +
        `Contact: ${SALES_EMAIL}\n${WEBSITE}`,
    },
    ar: {
      subject: "استلمنا طلبك — Mearva Seafood",
      body:
        "شكرًا لتواصلك مع Mearva Seafood.\n\n" +
        "لقد استلمنا طلبك الخاص بالمأكولات البحرية.\n\n" +
        (summaryAr ? summaryAr + "\n" : "") +
        "سيقوم فريق المبيعات بمراجعة توفر المنتج ومواصفاته والجوانب اللوجستية، " +
        "وسيتواصل معك.\n\n" +
        "تؤكّد هذه الرسالة استلام طلبك فقط، ولا تُعدّ تأكيدًا للسعر أو التوفر أو " +
        "الشحن أو موعد التسليم.\n\n" +
        `للتواصل: ${SALES_EMAIL}\n${WEBSITE}`,
    },
    no: {
      subject: "Vi har mottatt din forespørsel — Mearva Seafood",
      body:
        "Takk for at du kontaktet Mearva Seafood.\n\n" +
        "Vi har mottatt din sjømatforespørsel.\n\n" +
        (summaryNo ? summaryNo + "\n" : "") +
        "Salgsteamet vårt vil gjennomgå produkttilgjengelighet, spesifikasjoner " +
        "og logistikk, og tar kontakt med deg.\n\n" +
        "Denne e-posten bekrefter kun at forespørselen er mottatt. Den utgjør " +
        "ikke en bekreftelse på pris, tilgjengelighet, frakt eller levering.\n\n" +
        `Kontakt: ${SALES_EMAIL}\n${WEBSITE}`,
    },
  };
  return T[lang];
}

// --- Microsoft 365 channel (Microsoft Graph API over HTTPS) -----------------
// Workers cannot do raw SMTP reliably, so we use Graph sendMail. Requires a
// Microsoft Entra ID app registration with the Mail.Send application permission
// (admin-consented), and these Worker secrets (never in code/repo):
//   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_SENDER
// Plus CONFIRMATION_ENABLED = "true" to switch it on.

function m365Configured(env) {
  return !!(
    env &&
    String(env.CONFIRMATION_ENABLED).toLowerCase() === "true" &&
    env.MS_TENANT_ID &&
    env.MS_CLIENT_ID &&
    env.MS_CLIENT_SECRET &&
    env.MS_SENDER
  );
}

async function getGraphToken(env) {
  const body = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    client_secret: env.MS_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const r = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`,
    { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: body.toString() }
  );
  if (!r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return j.access_token || null;
}

/**
 * Send the customer confirmation via Microsoft 365 (Graph). Best-effort.
 * Contract: call this ONLY after the lead was successfully delivered to Sales.
 * Never throws; always resolves. A no-op/failure here does not affect the lead,
 * and it is only sent to the lead's own (already validated) email address.
 *
 * @param {object} lead - the delivered lead (must include a valid email)
 * @param {string} language - en | ar | no
 * @param {object} env - Worker env (M365 secrets + CONFIRMATION_ENABLED)
 * @returns {Promise<{sent:boolean, reason:string}>}
 */
export async function sendCustomerConfirmation(lead, language, env) {
  try {
    if (!lead || !lead.email) return { sent: false, reason: "no_recipient" };
    if (!m365Configured(env)) return { sent: false, reason: "not_configured" };

    const token = await getGraphToken(env);
    if (!token) return { sent: false, reason: "auth_failed" };

    const { subject, body } = buildConfirmationEmail(lead, language);
    const payload = {
      message: {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients: [{ emailAddress: { address: lead.email } }],
        // Automated send from no-reply (MS_SENDER); customer replies/follow-up
        // are directed to the Sales inbox.
        replyTo: [{ emailAddress: { address: SALES_EMAIL } }],
      },
      saveToSentItems: false,
    };
    const r = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_SENDER)}/sendMail`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    // Graph sendMail returns 202 Accepted on success.
    if (r.status === 202) return { sent: true, reason: "ok" };
    return { sent: false, reason: "send_failed_" + r.status };
  } catch (e) {
    // Must never surface into the lead flow.
    return { sent: false, reason: "error" };
  }
}

export default { buildConfirmationEmail, sendCustomerConfirmation };
