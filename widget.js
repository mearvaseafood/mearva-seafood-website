/* Mearva Seafood — "Ask Mearva" chat widget (frontend)
 * ---------------------------------------------------------------------------
 * Premium Norwegian Seafood Guide + B2B concierge. Dependency-free.
 * Talks ONLY to the secure backend Worker; no API key ever touches this file.
 *
 * Setup: set the backend URL before this script loads, e.g. in index.html:
 *   <script>window.MEARVA_CHAT_API_URL =
 *     "https://mearva-chat.mearva.workers.dev/api/chat";</script>
 *   <script src="widget.js" defer></script>
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var API_URL =
    (typeof window !== "undefined" && window.MEARVA_CHAT_API_URL) ||
    "https://mearva-chat.mearva.workers.dev/api/chat";

  // Lead endpoint lives next to the chat endpoint on the same Worker.
  var API_LEAD_URL = API_URL.replace(/\/api\/chat(\/?)$/, "/api/lead$1");

  var SALES_EMAIL = "sales@mearvaseafood.com";
  var PRIVACY_URL =
    (typeof window !== "undefined" && window.MEARVA_PRIVACY_URL) || "privacy.html";

  var NAVY = "#0D2340";
  var TEAL = "#2A9D8F";
  var TEAL_LIGHT = "#3FBDAC";

  // ---- Localised strings ---------------------------------------------------
  var STR = {
    en: {
      launch: "Ask Mearva",
      sub: "Your Norwegian Seafood Guide",
      greeting:
        "Welcome to Mearva Seafood.\nI'm your Norwegian Seafood Guide.\n\n" +
        "I can help you explore Norwegian seafood, understand fresh and " +
        "frozen options, learn about cold-chain shipping, or prepare a quote " +
        "request for Saudi Arabia and the GCC.",
      placeholder: "Type your message…",
      send: "Send",
      close: "Close",
      thinking: "Ask Mearva is thinking…",
      error:
        "Something went wrong while preparing the answer. Please try again, " +
        "or contact sales@mearvaseafood.com.",
      sendToSales: "Send to Sales",
      editDetails: "Edit Details",
      sending: "Sending…",
      sentBadge: "Request sent ✓",
      sent:
        "Thank you. Your request has been sent to the Mearva sales team. They " +
        "will review the product, availability and logistics and contact you at {email}.",
      sendFail:
        "We couldn't send the request right now. Your enquiry has not been " +
        "confirmed as submitted. Please try again or contact sales@mearvaseafood.com.",
      tryAgain: "Try Again",
      emailSales: "Email Sales",
      editHint: "I'd like to edit the details before sending.",
      newEnquiry: "New enquiry",
      learnShipping: "How does shipping work?",
      privacy: "Privacy",
      privacyNote:
        "Please don't share passwords, payment card details, ID numbers or " +
        "sensitive personal information with Ask Mearva.",
      leadMarketing:
        "Yes, send me seafood availability updates and commercial offers.",
      quick: [
        "Explore Norwegian Salmon",
        "Fresh or Frozen?",
        "How Shipping Works",
        "Cold Chain & Quality",
        "Request a Quote",
      ],
    },
    ar: {
      launch: "اسأل Mearva",
      sub: "دليلك للمأكولات البحرية النرويجية",
      greeting:
        "أهلاً بك في Mearva Seafood.\nأنا دليلك للمأكولات البحرية النرويجية.\n\n" +
        "أقدر أساعدك في التعرف على المنتجات، الفرق بين الطازج والمجمد، طريقة " +
        "الشحن وسلسلة التبريد، أو تجهيز طلب عرض سعر للسعودية ودول الخليج.",
      placeholder: "اكتب رسالتك…",
      send: "إرسال",
      close: "إغلاق",
      thinking: "Mearva يجهز الإجابة…",
      error:
        "حدث خطأ أثناء تجهيز الإجابة. حاول مرة أخرى، أو تواصل معنا عبر " +
        "sales@mearvaseafood.com.",
      sendToSales: "إرسال الطلب",
      editDetails: "تعديل البيانات",
      sending: "جارٍ الإرسال…",
      sentBadge: "تم إرسال الطلب ✓",
      sent:
        "شكراً لك. تم إرسال طلبك إلى فريق مبيعات Mearva. سيقوم الفريق بمراجعة " +
        "المنتج والتوفر والخدمات اللوجستية والتواصل معك عبر {email}.",
      sendFail:
        "تعذر إرسال الطلب حالياً. لم نفقد بيانات طلبك. يمكنك المحاولة مرة أخرى " +
        "أو التواصل مباشرة عبر sales@mearvaseafood.com.",
      tryAgain: "حاول مرة أخرى",
      emailSales: "مراسلة المبيعات",
      editHint: "أريد تعديل البيانات قبل الإرسال.",
      newEnquiry: "طلب جديد",
      learnShipping: "كيف يعمل الشحن؟",
      privacy: "الخصوصية",
      privacyNote:
        "يرجى عدم مشاركة كلمات المرور أو بيانات البطاقات أو أرقام الهوية أو أي " +
        "بيانات شخصية حساسة مع Ask Mearva.",
      leadMarketing:
        "نعم، أرسلوا لي تحديثات توفر المنتجات والعروض التجارية.",
      quick: [
        "اكتشف السلمون النرويجي",
        "طازج أم مجمد؟",
        "كيف تتم عملية الشحن؟",
        "سلسلة التبريد والجودة",
        "اطلب عرض سعر",
      ],
    },
    no: {
      launch: "Spør Mearva",
      sub: "Din norske sjømatguide",
      greeting:
        "Velkommen til Mearva Seafood.\nJeg er din norske sjømatguide.\n\n" +
        "Jeg kan hjelpe deg med å utforske norsk sjømat, forstå fersk og " +
        "fryst, lære om kjølekjede-frakt, eller forberede en forespørsel om " +
        "pristilbud for Saudi-Arabia og Golf-regionen.",
      placeholder: "Skriv meldingen din…",
      send: "Send",
      close: "Lukk",
      thinking: "Mearva tenker…",
      error:
        "Noe gikk galt under utarbeidelsen av svaret. Prøv igjen, eller " +
        "kontakt sales@mearvaseafood.com.",
      sendToSales: "Send til salg",
      editDetails: "Rediger detaljer",
      sending: "Sender…",
      sentBadge: "Forespørsel sendt ✓",
      sent:
        "Takk. Forespørselen din er sendt til Mearvas salgsteam. De vil vurdere " +
        "produkt, tilgjengelighet og logistikk og kontakte deg på {email}.",
      sendFail:
        "Vi kunne ikke sende forespørselen nå. Forespørselen din er ikke " +
        "bekreftet sendt. Prøv igjen eller kontakt sales@mearvaseafood.com.",
      tryAgain: "Prøv igjen",
      emailSales: "Send e-post",
      editHint: "Jeg vil redigere detaljene før sending.",
      newEnquiry: "Ny forespørsel",
      learnShipping: "Hvordan fungerer frakt?",
      privacy: "Personvern",
      privacyNote:
        "Vennligst ikke del passord, kortopplysninger, ID-numre eller sensitiv " +
        "personinformasjon med Ask Mearva.",
      leadMarketing:
        "Ja, send meg oppdateringer om sjømattilgjengelighet og kommersielle tilbud.",
      quick: [
        "Utforsk norsk laks",
        "Fersk eller fryst?",
        "Slik fungerer frakt",
        "Kjølekjede og kvalitet",
        "Be om pristilbud",
      ],
    },
  };

  function detectLang() {
    var l = (document.documentElement.getAttribute("lang") || "en")
      .slice(0, 2)
      .toLowerCase();
    return STR[l] ? l : "en";
  }

  var AR_RE = /[؀-ۿ]/;
  function isRTL(text) {
    return AR_RE.test(text || "");
  }

  // ---- Styles --------------------------------------------------------------
  // High specificity + explicit values so the site's global input/textarea
  // rules (dark navy bg / white text) never bleed into the widget.
  var P = ".mrv-panel"; // scope prefix
  var CSS =
    "" +
    // Launcher
    ".mrv-launch{position:fixed;bottom:22px;inset-inline-end:22px;z-index:2147483000;" +
    "display:flex;align-items:center;gap:10px;padding:11px 17px 11px 13px;border:0;" +
    "border-radius:40px;background:" + NAVY + ";color:#fff;cursor:pointer;" +
    "font:600 15px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;" +
    "box-shadow:0 8px 24px rgba(13,35,64,.28);transition:transform .15s ease,box-shadow .15s ease}" +
    ".mrv-launch:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(13,35,64,.34)}" +
    ".mrv-launch svg{width:26px;height:26px;flex:0 0 auto}" +
    ".mrv-launch.mrv-hidden{display:none}" +
    // Panel shell
    P + "{position:fixed;bottom:22px;inset-inline-end:22px;z-index:2147483000;" +
    "width:390px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 44px);" +
    "display:none;flex-direction:column;background:#fff;border-radius:16px;overflow:hidden;" +
    "box-shadow:0 20px 60px rgba(13,35,64,.32);" +
    "font:400 15px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:" + NAVY + "}" +
    P + ".mrv-open{display:flex}" +
    // Header
    P + " .mrv-head{display:flex;align-items:center;gap:12px;padding:15px 16px;background:" + NAVY + ";color:#fff;flex:0 0 auto}" +
    P + " .mrv-head svg{width:34px;height:34px;flex:0 0 auto}" +
    P + " .mrv-title{flex:1;min-width:0}" +
    P + " .mrv-name{font-weight:600;font-size:16px;letter-spacing:.01em}" +
    P + " .mrv-sub{font-size:12px;opacity:.82;margin-top:2px}" +
    P + " .mrv-x{background:transparent;border:0;color:#fff;cursor:pointer;font-size:22px;" +
    "line-height:1;padding:4px 6px;opacity:.85;flex:0 0 auto}" + P + " .mrv-x:hover{opacity:1}" +
    // Body
    P + " .mrv-body{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;padding:16px;" +
    "background:#f5f7f6;display:flex;flex-direction:column;gap:12px;-webkit-overflow-scrolling:touch}" +
    // Bubbles
    P + " .mrv-msg{max-width:86%;padding:11px 14px;border-radius:14px;font-size:15px;line-height:1.6;" +
    "word-wrap:break-word;overflow-wrap:anywhere}" +
    P + " .mrv-bot{align-self:flex-start;background:#fff;color:" + NAVY + ";" +
    "border:1px solid #e6ebef;border-bottom-left-radius:5px;box-shadow:0 1px 2px rgba(13,35,64,.04)}" +
    P + " .mrv-user{align-self:flex-end;background:" + TEAL + ";color:#fff;border-bottom-right-radius:5px}" +
    P + ' .mrv-msg[dir="rtl"]{text-align:right}' +
    P + ' .mrv-bot[dir="rtl"]{align-self:flex-start;border-bottom-left-radius:5px;border-bottom-right-radius:14px}' +
    P + ' .mrv-user[dir="rtl"]{align-self:flex-end;border-bottom-right-radius:5px;border-bottom-left-radius:14px}' +
    // Markdown inside bubbles
    P + " .mrv-msg p{margin:0 0 9px}" + P + " .mrv-msg p:last-child{margin-bottom:0}" +
    P + " .mrv-msg strong{font-weight:650}" +
    P + " .mrv-msg ul,.mrv-panel .mrv-msg ol{margin:6px 0 9px;padding-inline-start:20px}" +
    P + " .mrv-msg li{margin:3px 0}" +
    P + " .mrv-msg ul{list-style:none}" +
    P + " .mrv-msg ul>li{position:relative;padding-inline-start:14px}" +
    P + " .mrv-msg ul>li::before{content:'';position:absolute;inset-inline-start:0;top:.66em;" +
    "width:5px;height:5px;border-radius:50%;background:" + TEAL + "}" +
    P + " .mrv-msg h4{font-size:14px;font-weight:650;margin:8px 0 5px;color:" + NAVY + "}" +
    P + " .mrv-bot a{color:" + TEAL + ";text-decoration:underline;text-underline-offset:2px}" +
    P + " .mrv-user a{color:#fff;text-decoration:underline}" +
    // Suggestion chips
    P + " .mrv-quick{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0}" +
    P + ' .mrv-quick[dir="rtl"]{justify-content:flex-start}' +
    P + " .mrv-chip{border:1px solid #cfe0dc;background:#fff;color:" + NAVY + ";" +
    "border-radius:20px;padding:7px 13px;font:inherit;font-size:13.5px;cursor:pointer;" +
    "line-height:1.3;transition:background .12s ease,color .12s ease,border-color .12s ease}" +
    P + " .mrv-chip:hover{background:" + TEAL + ";color:#fff;border-color:" + TEAL + "}" +
    P + " .mrv-chip-primary{background:" + TEAL + ";color:#fff;border-color:" + TEAL + "}" +
    P + " .mrv-chip-primary:hover{background:" + TEAL_LIGHT + ";border-color:" + TEAL_LIGHT + "}" +
    P + " .mrv-chip:disabled{opacity:.55;cursor:default;background:#fff;color:" + NAVY + ";border-color:#cfe0dc}" +
    P + " .mrv-chip-primary:disabled{opacity:.7;cursor:default;background:" + TEAL + ";color:#fff}" +
    P + " .mrv-sent{display:inline-flex;align-items:center;gap:6px;background:#e8f3f1;color:" + NAVY + ";" +
    "border:1px solid #cfe0dc;border-radius:20px;padding:7px 13px;font-size:13.5px;font-weight:600}" +
    // Lead handoff: optional consent + submitted state
    P + " .mrv-lead{display:flex;flex-direction:column;gap:10px;margin:2px 0}" +
    P + " .mrv-consent{display:flex;gap:9px;align-items:flex-start;font-size:13px;color:#42566a;line-height:1.45;cursor:pointer}" +
    P + " .mrv-consent input[type=checkbox]{width:16px;height:16px;flex:0 0 auto;margin:1px 0 0;accent-color:" + TEAL + ";cursor:pointer}" +
    // Legal strip under the composer (privacy link + sensitive-data notice)
    P + " .mrv-legal{display:flex;flex-wrap:wrap;gap:5px 10px;align-items:center;padding:7px 12px;" +
    "border-top:1px solid #eef2f5;background:#fff;flex:0 0 auto;font-size:11px;color:#8a99a8;line-height:1.4}" +
    P + " .mrv-legal-note{flex:1 1 150px;min-width:120px}" +
    P + " .mrv-legal a{color:#6b7f90;text-decoration:underline;white-space:nowrap;flex:0 0 auto}" +
    // Typing
    P + " .mrv-typing{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;" +
    "background:#fff;border:1px solid #e6ebef;border-radius:14px;border-bottom-left-radius:5px;padding:11px 14px}" +
    P + " .mrv-typing .mrv-dots{display:inline-flex;gap:4px}" +
    P + " .mrv-typing i{width:7px;height:7px;border-radius:50%;background:#9fb0c0;display:block;" +
    "animation:mrv-blink 1.2s infinite ease-in-out}" +
    P + " .mrv-typing i:nth-child(2){animation-delay:.2s}" + P + " .mrv-typing i:nth-child(3){animation-delay:.4s}" +
    P + " .mrv-typing span{font-size:13px;color:#6b7f90}" +
    "@keyframes mrv-blink{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}" +
    // Footer input — explicit light styling, wins over site globals
    P + " .mrv-foot{display:flex;gap:8px;padding:12px;border-top:1px solid #e6ebf0;background:#fff;flex:0 0 auto}" +
    P + " .mrv-foot textarea{flex:1 1 auto;width:auto;resize:none;min-height:0;" +
    "background:#ffffff;color:" + NAVY + ";border:1px solid #cbd5df;border-radius:12px;" +
    "padding:11px 13px;font:inherit;font-size:15px;line-height:1.4;max-height:120px;" +
    "outline:none;box-shadow:none;transition:border-color .15s ease,box-shadow .15s ease}" +
    P + " .mrv-foot textarea::placeholder{color:#8a99a8;opacity:1}" +
    P + " .mrv-foot textarea:focus{border-color:" + TEAL + ";box-shadow:0 0 0 3px rgba(42,157,143,.15)}" +
    P + " .mrv-foot button{flex:0 0 auto;border:0;border-radius:12px;background:" + TEAL + ";" +
    "color:#fff;padding:0 17px;cursor:pointer;font:inherit;font-weight:600;font-size:15px}" +
    P + " .mrv-foot button:hover{background:" + TEAL_LIGHT + "}" +
    P + " .mrv-foot button:disabled{opacity:.5;cursor:default}" +
    // Mobile
    "@media (max-width:480px){" + P + "{inset-inline:8px;bottom:8px;width:auto;" +
    "height:88vh;height:88dvh;max-height:none}.mrv-launch{bottom:14px;inset-inline-end:14px}}";

  // STRATA diamond mark. `light` = for dark backgrounds.
  function diamond(light) {
    var a = light ? "#FFFFFF" : NAVY;
    var b = light ? TEAL_LIGHT : TEAL;
    return (
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<polygon points="32,2 47,17 17,17" fill="' + a + '"/>' +
      '<polygon points="14,20 50,20 61,31 3,31" fill="' + a + '"/>' +
      '<polygon points="4,34 60,34 49,45 15,45" fill="' + b + '"/>' +
      '<polygon points="18,48 46,48 32,62" fill="' + a + '"/>' +
      "</svg>"
    );
  }

  // ---- Safe, limited Markdown renderer ------------------------------------
  // Escapes all HTML first, then re-introduces only a known-safe tag subset.
  // Also extracts an optional "::SUGGEST:: a :: b :: c" line into chips.
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function safeLink(href, text) {
    if (!/^(https?:|mailto:)/i.test(href)) return text;
    var attrs = /^mailto:/i.test(href)
      ? ""
      : ' target="_blank" rel="noopener noreferrer"';
    return '<a href="' + href.replace(/"/g, "%22") + '"' + attrs + ">" + text + "</a>";
  }

  // Inline formatting on already-escaped text.
  function inlineFmt(s) {
    // [text](url)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, function (m, t, u) {
      return safeLink(u, t);
    });
    // **bold**
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // bare emails -> mailto (kept LTR with <bdi>)
    s = s.replace(
      /(^|[\s(>])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?=[\s.,;:)<]|$)/g,
      function (m, pre, mail) {
        return pre + "<bdi>" + safeLink("mailto:" + mail, mail) + "</bdi>";
      }
    );
    // bare URLs (kept LTR with <bdi>)
    s = s.replace(/(^|[\s(>])(https?:\/\/[^\s)<]+)/g, function (m, pre, url) {
      return pre + "<bdi>" + safeLink(url, url) + "</bdi>";
    });
    return s;
  }

  function renderMarkdown(text) {
    var suggestions = [];
    var lead = null;
    var lines = String(text || "").replace(/\r/g, "").split("\n");

    // Pull out the ::LEAD:: and ::SUGGEST:: machine lines (never displayed).
    var kept = [];
    lines.forEach(function (ln) {
      var mL = ln.match(/^\s*::LEAD::\s*(.*)$/i);
      if (mL) {
        try {
          var parsed = JSON.parse(mL[1]);
          if (parsed && typeof parsed === "object") lead = parsed;
        } catch (e) {
          /* malformed lead line — ignore, show nothing */
        }
        return;
      }
      var m = ln.match(/^\s*::SUGGEST::\s*(.*)$/i);
      if (m) {
        m[1].split("::").forEach(function (opt) {
          var t = opt.trim();
          if (t) suggestions.push(t);
        });
        return;
      }
      kept.push(ln);
    });

    var html = "";
    var list = null; // {tag, items[]}
    function flush() {
      if (!list) return;
      html +=
        "<" + list.tag + ">" +
        list.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") +
        "</" + list.tag + ">";
      list = null;
    }

    kept.forEach(function (raw) {
      var line = raw.replace(/\s+$/, "");
      if (/^\s*(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) return; // drop --- rules
      if (/^\s*$/.test(line)) { flush(); return; } // blank = block break

      var mUl = line.match(/^\s*[-*•]\s+(.*)$/);
      var mOl = line.match(/^\s*\d+[.)]\s+(.*)$/);
      var mH = line.match(/^\s*#{1,6}\s+(.*)$/);

      if (mUl) {
        if (!list || list.tag !== "ul") { flush(); list = { tag: "ul", items: [] }; }
        list.items.push(inlineFmt(esc(mUl[1])));
      } else if (mOl) {
        if (!list || list.tag !== "ol") { flush(); list = { tag: "ol", items: [] }; }
        list.items.push(inlineFmt(esc(mOl[1])));
      } else if (mH) {
        flush();
        html += "<h4>" + inlineFmt(esc(mH[1])) + "</h4>";
      } else {
        flush();
        html += "<p>" + inlineFmt(esc(line.trim())) + "</p>";
      }
    });
    flush();

    return { html: html || "<p></p>", suggestions: suggestions.slice(0, 4), lead: lead };
  }

  // ---- State ---------------------------------------------------------------
  var lang = detectLang();
  var history = [];
  var started = false;
  var sending = false;
  var stickToBottom = true;
  var els = {};

  function t() { return STR[lang]; }

  // ---- Build DOM -----------------------------------------------------------
  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var launch = document.createElement("button");
    launch.className = "mrv-launch";
    launch.type = "button";
    launch.setAttribute("aria-haspopup", "dialog");
    launch.innerHTML = diamond(true) + '<span class="mrv-launch-label"></span>';
    launch.addEventListener("click", openPanel);

    var panel = document.createElement("div");
    panel.className = "mrv-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask Mearva");
    panel.innerHTML =
      '<div class="mrv-head">' + diamond(true) +
      '<div class="mrv-title"><div class="mrv-name"></div><div class="mrv-sub"></div></div>' +
      '<button class="mrv-x" type="button" aria-label="">&times;</button></div>' +
      '<div class="mrv-body" aria-live="polite"></div>' +
      '<form class="mrv-foot"><textarea rows="1" aria-label=""></textarea>' +
      '<button type="submit"></button></form>' +
      '<div class="mrv-legal"><span class="mrv-legal-note"></span>' +
      '<a class="mrv-legal-link" target="_blank" rel="noopener"></a></div>';

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    els.launch = launch;
    els.launchLabel = launch.querySelector(".mrv-launch-label");
    els.panel = panel;
    els.name = panel.querySelector(".mrv-name");
    els.sub = panel.querySelector(".mrv-sub");
    els.close = panel.querySelector(".mrv-x");
    els.body = panel.querySelector(".mrv-body");
    els.form = panel.querySelector(".mrv-foot");
    els.input = panel.querySelector("textarea");
    els.send = panel.querySelector('button[type="submit"]');
    els.legalNote = panel.querySelector(".mrv-legal-note");
    els.legalLink = panel.querySelector(".mrv-legal-link");

    els.close.addEventListener("click", closePanel);
    els.form.addEventListener("submit", onSubmit);
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e); }
    });
    els.input.addEventListener("input", autoGrow);

    // Track whether the user is at the bottom (so we don't fight upward scroll).
    els.body.addEventListener("scroll", function () {
      var b = els.body;
      stickToBottom = b.scrollHeight - b.scrollTop - b.clientHeight < 90;
    });

    applyLang();

    new MutationObserver(function () {
      var next = detectLang();
      if (next !== lang) {
        lang = next;
        applyLang();
        if (!started) renderConversation();
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "dir"],
    });
  }

  function applyLang() {
    var s = t();
    var rtl = lang === "ar";
    els.launchLabel.textContent = s.launch;
    els.launch.setAttribute("aria-label", s.launch);
    els.name.textContent = s.launch;
    els.sub.textContent = s.sub;
    els.close.setAttribute("aria-label", s.close);
    els.input.setAttribute("placeholder", s.placeholder);
    els.input.setAttribute("aria-label", s.placeholder);
    els.send.textContent = s.send;
    els.legalNote.textContent = s.privacyNote;
    els.legalLink.textContent = s.privacy;
    els.legalLink.setAttribute("href", PRIVACY_URL);
    els.panel.setAttribute("dir", rtl ? "rtl" : "ltr");
  }

  // ---- Rendering -----------------------------------------------------------
  function assistantBubble(text) {
    var out = renderMarkdown(text);
    var div = document.createElement("div");
    div.className = "mrv-msg mrv-bot";
    div.setAttribute("dir", isRTL(text) ? "rtl" : "ltr");
    div.innerHTML = out.html;
    els.body.appendChild(div);
    if (out.lead) appendLeadActions(out.lead);
    else if (out.suggestions.length) appendChips(out.suggestions);
  }

  function userBubble(text) {
    var div = document.createElement("div");
    div.className = "mrv-msg mrv-user";
    div.setAttribute("dir", isRTL(text) ? "rtl" : "ltr");
    div.textContent = text; // escaped by textContent — never rendered as markdown
    els.body.appendChild(div);
  }

  function makeChip(label, primary) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mrv-chip" + (primary ? " mrv-chip-primary" : "");
    b.textContent = label;
    return b;
  }

  function newRow() {
    var wrap = document.createElement("div");
    wrap.className = "mrv-quick";
    wrap.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    return wrap;
  }

  function appendChips(items) {
    var wrap = newRow();
    items.forEach(function (q) {
      var chip = makeChip(q, false);
      chip.addEventListener("click", function () { submitMessage(q); });
      wrap.appendChild(chip);
    });
    els.body.appendChild(wrap);
  }

  // ---- Lead handoff --------------------------------------------------------
  // The model prepares the lead and appends a hidden ::LEAD:: JSON line. The
  // widget shows Send / Edit, and ONLY the backend result decides whether we
  // may say "sent". Nothing here claims success on its own.
  function appendLeadActions(lead) {
    var box = document.createElement("div");
    box.className = "mrv-lead";
    box.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    // Optional marketing consent — unchecked by default; does NOT block sending.
    var label = document.createElement("label");
    label.className = "mrv-consent";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    var span = document.createElement("span");
    span.textContent = t().leadMarketing;
    label.appendChild(cb);
    label.appendChild(span);
    box.appendChild(label);

    var row = newRow();
    var send = makeChip(t().sendToSales, true);
    var edit = makeChip(t().editDetails, false);
    send.addEventListener("click", function () { submitLead(lead, box, row, send, cb.checked); });
    edit.addEventListener("click", function () {
      if (box.dataset.busy === "1" || box.dataset.done === "1") return;
      submitMessage(t().editHint);
    });
    row.appendChild(send);
    row.appendChild(edit);
    box.appendChild(row);
    els.body.appendChild(box);
    maybeScroll();
  }

  function submitLead(lead, box, row, btn, consent) {
    if (box.dataset.busy === "1" || box.dataset.done === "1") return; // no double-submit
    box.dataset.busy = "1";
    box.querySelectorAll("button, input").forEach(function (el) { el.disabled = true; });
    btn.textContent = t().sending;

    // Marketing consent is separate from the enquiry and defaults to "no";
    // only a deliberate tick sends "yes". It never blocks the submission.
    var payload = {
      lead: lead,
      language: lang,
      marketing_consent: consent ? "yes" : "no",
      marketing_consent_timestamp: new Date().toISOString(),
      marketing_consent_source: "ask_mearva",
      marketing_consent_language: lang,
    };

    fetch(API_LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, data: d }; }, function () {
          return { ok: r.ok, data: {} };
        });
      })
      .then(function (res) {
        var success = res.ok && res.data && res.data.ok === true;
        box.dataset.busy = "";
        if (success) {
          box.dataset.done = "1";
          markLeadSubmitted(row);
          var email = (lead && lead.email) || SALES_EMAIL;
          var msg = t().sent.replace("{email}", email);
          history.push({ role: "assistant", content: msg });
          assistantBubble(msg);
          appendChips([t().newEnquiry, t().learnShipping]);
        } else {
          box.remove();
          assistantBubble(t().sendFail);
          appendFailActions(lead, consent);
        }
      })
      .catch(function () {
        box.dataset.busy = "";
        box.remove();
        assistantBubble(t().sendFail);
        appendFailActions(lead, consent);
      })
      .then(function () { maybeScroll(); });
  }

  // Clear, non-clickable "submitted" state — prevents any further sending.
  function markLeadSubmitted(row) {
    row.innerHTML = "";
    var pill = document.createElement("span");
    pill.className = "mrv-sent";
    pill.textContent = t().sentBadge;
    row.appendChild(pill);
  }

  // Preserves the visitor's consent choice across retries.
  function appendFailActions(lead, consent) {
    var box = document.createElement("div");
    box.className = "mrv-lead";
    box.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    var row = newRow();
    var again = makeChip(t().tryAgain, true);
    var mail = makeChip(t().emailSales, false);
    again.addEventListener("click", function () { submitLead(lead, box, row, again, consent); });
    mail.addEventListener("click", function () { mailtoSales(lead); });
    row.appendChild(again);
    row.appendChild(mail);
    box.appendChild(row);
    els.body.appendChild(box);
    maybeScroll();
  }

  // Fallback path: open the visitor's mail client, prefilled. No automated
  // send, no secrets — the visitor sends it themselves.
  function mailtoSales(lead) {
    lead = lead || {};
    var lines = [
      "Name: " + (lead.name || ""),
      "Company: " + (lead.company || ""),
      "Email: " + (lead.email || ""),
      "Country: " + (lead.country || ""),
      "Destination: " + (lead.destination || ""),
      "Product: " + (lead.product || ""),
      "Fresh/Frozen: " + (lead.freshFrozen || ""),
      "Approximate volume: " + (lead.volume || ""),
      "Timing: " + (lead.timing || ""),
      "Notes: " + (lead.notes || ""),
    ];
    var href =
      "mailto:" + SALES_EMAIL +
      "?subject=" + encodeURIComponent("Quote request — Mearva Seafood") +
      "&body=" + encodeURIComponent(lines.join("\n"));
    window.location.href = href;
  }

  function renderConversation() {
    els.body.innerHTML = "";
    assistantBubble(t().greeting);
    if (!started) appendChips(t().quick);
    history.forEach(function (m) {
      if (m.role === "user") userBubble(m.content);
      else assistantBubble(m.content);
    });
    stickToBottom = true;
    scrollDown();
  }

  function showTyping() {
    var d = document.createElement("div");
    d.className = "mrv-typing";
    d.setAttribute("data-mrv-typing", "1");
    d.innerHTML =
      '<span class="mrv-dots"><i></i><i></i><i></i></span><span>' + esc(t().thinking) + "</span>";
    els.body.appendChild(d);
    maybeScroll();
  }

  function hideTyping() {
    var d = els.body.querySelector('[data-mrv-typing="1"]');
    if (d) d.remove();
  }

  function scrollDown() { els.body.scrollTop = els.body.scrollHeight; }
  function maybeScroll() { if (stickToBottom) scrollDown(); }

  function autoGrow() {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + "px";
  }

  // ---- Open / close --------------------------------------------------------
  function openPanel() {
    els.launch.classList.add("mrv-hidden");
    els.panel.classList.add("mrv-open");
    if (!els.body.childNodes.length) renderConversation();
    else scrollDown();
    setTimeout(function () { els.input.focus(); }, 50);
  }

  function closePanel() {
    els.panel.classList.remove("mrv-open");
    els.launch.classList.remove("mrv-hidden");
  }

  // ---- Send ----------------------------------------------------------------
  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    var text = els.input.value.trim();
    if (text) submitMessage(text);
  }

  function submitMessage(text) {
    if (sending) return; // prevent double-submit

    if (!started) {
      started = true;
      els.body.innerHTML = "";
      assistantBubble(t().greeting);
    }

    history.push({ role: "user", content: text });
    userBubble(text);
    els.input.value = "";
    autoGrow();
    stickToBottom = true;
    scrollDown();

    sending = true;
    els.send.disabled = true;
    showTyping();

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, language: lang }),
    })
      .then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (res) {
        hideTyping();
        var reply = res.ok && res.data && res.data.reply;
        if (reply) {
          history.push({ role: "assistant", content: reply });
          assistantBubble(reply);
        } else {
          assistantBubble(t().error);
        }
      })
      .catch(function () {
        hideTyping();
        assistantBubble(t().error);
      })
      .then(function () {
        sending = false;
        els.send.disabled = false;
        maybeScroll();
        els.input.focus();
      });
  }

  // ---- Init ----------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
