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

/**
 * Send the customer confirmation — INACTIVE until a channel is configured.
 * Contract: call this ONLY after the lead was successfully delivered to Sales.
 * Never throws; always resolves. A no-op/failure here does not affect the lead.
 *
 * @param {object} lead - the delivered lead (must include a valid email)
 * @param {string} language - en | ar | no
 * @param {object} env - Worker env (a provider must be configured to actually send)
 * @returns {Promise<{sent:boolean, reason:string}>}
 */
export async function sendCustomerConfirmation(lead, language, env) {
  try {
    if (!lead || !lead.email) return { sent: false, reason: "no_recipient" };
    // No channel configured yet -> no-op. (See header note: needs a business
    // decision on Web3Forms PRO autoresponder or a transactional provider.)
    if (!env || !env.CONFIRMATION_ENABLED) {
      return { sent: false, reason: "not_configured" };
    }
    // Future: dispatch buildConfirmationEmail(lead, language) via the configured
    // provider here. Kept unimplemented so nothing sends until explicitly wired.
    return { sent: false, reason: "channel_not_implemented" };
  } catch (e) {
    // Must never surface into the lead flow.
    return { sent: false, reason: "error" };
  }
}

export default { buildConfirmationEmail, sendCustomerConfirmation };
