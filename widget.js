/* Mearva Seafood — "Ask Mearva" chat widget (frontend)
 * ---------------------------------------------------------------------------
 * Drop-in, dependency-free widget for index.html. It talks ONLY to the
 * secure backend Worker; no API key ever touches this file.
 *
 * Setup:
 *   1) Deploy worker/ to Cloudflare (see worker/README.md).
 *   2) Set the backend URL before this script loads, e.g. in index.html:
 *        <script>window.MEARVA_CHAT_API_URL =
 *          "https://mearva-chat.<your-subdomain>.workers.dev/api/chat";</script>
 *        <script src="widget.js" defer></script>
 *      (or edit the fallback below).
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var API_URL =
    (typeof window !== "undefined" && window.MEARVA_CHAT_API_URL) ||
    "https://mearva-chat.example.workers.dev/api/chat";

  var NAVY = "#0D2340";
  var TEAL = "#2A9D8F";
  var TEAL_LIGHT = "#3FBDAC";

  // ---- Localised strings ---------------------------------------------------
  var STR = {
    en: {
      launch: "Ask Mearva",
      sub: "Your Norwegian Seafood Guide",
      greeting:
        "Hello — I'm Mearva, your Norwegian seafood guide. I can help you " +
        "learn about our products, cold-chain logistics, and how to source " +
        "Norwegian seafood for Saudi Arabia and the GCC. What would you like " +
        "to know?",
      placeholder: "Type your message…",
      send: "Send",
      close: "Close",
      error:
        "Sorry, I couldn't reach the assistant just now. Please try again, " +
        "or email sales@mearvaseafood.com.",
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
        "مرحباً — أنا Mearva، دليلك للمأكولات البحرية النرويجية. يسعدني " +
        "مساعدتك في التعرف على منتجاتنا، سلسلة التبريد، وكيفية الحصول على " +
        "مأكولات بحرية نرويجية للسعودية والخليج. بماذا تودّ الاستفسار؟",
      placeholder: "اكتب رسالتك…",
      send: "إرسال",
      close: "إغلاق",
      error:
        "عذراً، تعذّر الوصول إلى المساعد الآن. يرجى المحاولة مرة أخرى أو " +
        "مراسلتنا على sales@mearvaseafood.com.",
      quick: [
        "اكتشف السلمون النرويجي",
        "طازج أم مجمد؟",
        "كيف يعمل الشحن؟",
        "سلسلة التبريد",
        "اطلب عرض سعر",
      ],
    },
    no: {
      launch: "Spør Mearva",
      sub: "Din norske sjømatguide",
      greeting:
        "Hei — jeg er Mearva, din norske sjømatguide. Jeg kan hjelpe deg med " +
        "å lære om produktene våre, kjølekjede-logistikk, og hvordan skaffe " +
        "norsk sjømat til Saudi-Arabia og Golf-regionen. Hva vil du vite?",
      placeholder: "Skriv meldingen din…",
      send: "Send",
      close: "Lukk",
      error:
        "Beklager, jeg fikk ikke kontakt med assistenten nå. Prøv igjen, " +
        "eller send e-post til sales@mearvaseafood.com.",
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

  // ---- Styles --------------------------------------------------------------
  var CSS =
    "" +
    ".mrv-launch{position:fixed;bottom:22px;inset-inline-end:22px;z-index:2147483000;" +
    "display:flex;align-items:center;gap:10px;padding:11px 16px 11px 12px;border:0;" +
    "border-radius:40px;background:" +
    NAVY +
    ";color:#fff;cursor:pointer;font:600 15px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;" +
    "box-shadow:0 8px 24px rgba(13,35,64,.28);transition:transform .15s ease,box-shadow .15s ease}" +
    ".mrv-launch:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(13,35,64,.34)}" +
    ".mrv-launch svg{width:26px;height:26px;flex:0 0 auto}" +
    ".mrv-launch.mrv-hidden{display:none}" +
    ".mrv-panel{position:fixed;bottom:22px;inset-inline-end:22px;z-index:2147483000;" +
    "width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 44px);" +
    "display:none;flex-direction:column;background:#fff;border-radius:16px;overflow:hidden;" +
    "box-shadow:0 20px 60px rgba(13,35,64,.32);" +
    "font:400 15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:" +
    NAVY +
    "}" +
    ".mrv-panel.mrv-open{display:flex}" +
    ".mrv-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:" +
    NAVY +
    ";color:#fff}" +
    ".mrv-head svg{width:34px;height:34px;flex:0 0 auto}" +
    ".mrv-head .mrv-title{flex:1;min-width:0}" +
    ".mrv-head .mrv-name{font-weight:600;font-size:16px}" +
    ".mrv-head .mrv-sub{font-size:12px;opacity:.8;margin-top:2px}" +
    ".mrv-x{background:transparent;border:0;color:#fff;cursor:pointer;font-size:22px;" +
    "line-height:1;padding:4px 6px;opacity:.85}.mrv-x:hover{opacity:1}" +
    ".mrv-body{flex:1;overflow-y:auto;padding:16px;background:#f6f8fa;" +
    "display:flex;flex-direction:column;gap:10px}" +
    ".mrv-msg{max-width:85%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;" +
    "word-wrap:break-word;overflow-wrap:anywhere}" +
    ".mrv-bot{align-self:flex-start;background:#fff;border:1px solid #e3e8ee;" +
    "border-bottom-left-radius:4px}" +
    ".mrv-user{align-self:flex-end;background:" +
    TEAL +
    ";color:#fff;border-bottom-right-radius:4px}" +
    ".mrv-quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}" +
    ".mrv-chip{border:1px solid " +
    TEAL +
    ";background:#fff;color:" +
    NAVY +
    ";border-radius:20px;padding:7px 13px;font-size:13.5px;cursor:pointer;" +
    "transition:background .12s ease,color .12s ease}" +
    ".mrv-chip:hover{background:" +
    TEAL +
    ";color:#fff}" +
    ".mrv-typing{align-self:flex-start;display:inline-flex;gap:4px;background:#fff;" +
    "border:1px solid #e3e8ee;border-radius:14px;border-bottom-left-radius:4px;padding:12px 14px}" +
    ".mrv-typing span{width:7px;height:7px;border-radius:50%;background:#9fb0c0;" +
    "animation:mrv-blink 1.2s infinite ease-in-out}" +
    ".mrv-typing span:nth-child(2){animation-delay:.2s}" +
    ".mrv-typing span:nth-child(3){animation-delay:.4s}" +
    "@keyframes mrv-blink{0%,80%,100%{opacity:.3;transform:translateY(0)}" +
    "40%{opacity:1;transform:translateY(-3px)}}" +
    ".mrv-foot{display:flex;gap:8px;padding:12px;border-top:1px solid #e6ebf0;background:#fff}" +
    ".mrv-foot textarea{flex:1;resize:none;border:1px solid #d3dbe4;border-radius:12px;" +
    "padding:10px 12px;font:inherit;color:" +
    NAVY +
    ";max-height:110px;outline:none}" +
    ".mrv-foot textarea:focus{border-color:" +
    TEAL +
    "}" +
    ".mrv-foot button{flex:0 0 auto;border:0;border-radius:12px;background:" +
    TEAL +
    ";color:#fff;padding:0 16px;cursor:pointer;font:inherit;font-weight:600}" +
    ".mrv-foot button:hover{background:" +
    TEAL_LIGHT +
    "}.mrv-foot button:disabled{opacity:.5;cursor:default}" +
    '[dir="rtl"] .mrv-bot{border-bottom-left-radius:14px;border-bottom-right-radius:4px}' +
    '[dir="rtl"] .mrv-user{border-bottom-right-radius:14px;border-bottom-left-radius:4px}' +
    "@media (max-width:480px){.mrv-panel{inset-inline:8px;bottom:8px;width:auto;" +
    "height:calc(100vh - 16px);max-height:none}.mrv-launch{bottom:14px;inset-inline-end:14px}}";

  // STRATA diamond mark. `light` = for dark backgrounds (white + teal-light).
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

  // ---- State ---------------------------------------------------------------
  var lang = detectLang();
  var history = []; // [{role:"user"|"assistant", content:string}]
  var started = false; // set once the visitor sends a first message
  var sending = false;
  var els = {};

  function t() {
    return STR[lang];
  }

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
      '<div class="mrv-head">' +
      diamond(true) +
      '<div class="mrv-title"><div class="mrv-name"></div>' +
      '<div class="mrv-sub"></div></div>' +
      '<button class="mrv-x" type="button" aria-label="">&times;</button>' +
      "</div>" +
      '<div class="mrv-body" aria-live="polite"></div>' +
      '<form class="mrv-foot">' +
      "<textarea rows=\"1\" aria-label=\"\"></textarea>" +
      '<button type="submit"></button>' +
      "</form>";

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

    els.close.addEventListener("click", closePanel);
    els.form.addEventListener("submit", onSubmit);
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      }
    });
    els.input.addEventListener("input", autoGrow);

    applyLang();

    // Keep the widget language in sync with the site's language switcher.
    new MutationObserver(function () {
      var next = detectLang();
      if (next !== lang) {
        lang = next;
        applyLang();
        if (!started) renderConversation(); // refresh greeting + chips
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
    els.panel.setAttribute("dir", rtl ? "rtl" : "ltr");
  }

  // ---- Rendering -----------------------------------------------------------
  function bubble(role, text) {
    var div = document.createElement("div");
    div.className = "mrv-msg " + (role === "user" ? "mrv-user" : "mrv-bot");
    div.textContent = text;
    return div;
  }

  function renderConversation() {
    els.body.innerHTML = "";
    els.body.appendChild(bubble("assistant", t().greeting));

    if (!started) {
      var wrap = document.createElement("div");
      wrap.className = "mrv-quick";
      t().quick.forEach(function (q) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "mrv-chip";
        chip.textContent = q;
        chip.addEventListener("click", function () {
          submitMessage(q);
        });
        wrap.appendChild(chip);
      });
      els.body.appendChild(wrap);
    }

    history.forEach(function (m) {
      els.body.appendChild(bubble(m.role, m.content));
    });
    scrollDown();
  }

  function showTyping() {
    var d = document.createElement("div");
    d.className = "mrv-typing";
    d.innerHTML = "<span></span><span></span><span></span>";
    d.setAttribute("data-mrv-typing", "1");
    els.body.appendChild(d);
    scrollDown();
  }

  function hideTyping() {
    var d = els.body.querySelector('[data-mrv-typing="1"]');
    if (d) d.remove();
  }

  function scrollDown() {
    els.body.scrollTop = els.body.scrollHeight;
  }

  function autoGrow() {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 110) + "px";
  }

  // ---- Open / close --------------------------------------------------------
  function openPanel() {
    els.launch.classList.add("mrv-hidden");
    els.panel.classList.add("mrv-open");
    if (!els.body.childNodes.length) renderConversation();
    setTimeout(function () {
      els.input.focus();
    }, 50);
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
    if (sending) return;

    // First real message: remove greeting + quick replies, keep the thread.
    if (!started) {
      started = true;
      els.body.innerHTML = "";
      els.body.appendChild(bubble("assistant", t().greeting));
    }

    history.push({ role: "user", content: text });
    els.body.appendChild(bubble("user", text));
    els.input.value = "";
    autoGrow();
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
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        hideTyping();
        var reply = res.ok && res.data && res.data.reply;
        if (reply) {
          history.push({ role: "assistant", content: reply });
          els.body.appendChild(bubble("assistant", reply));
        } else {
          els.body.appendChild(bubble("assistant", t().error));
        }
      })
      .catch(function () {
        hideTyping();
        els.body.appendChild(bubble("assistant", t().error));
      })
      .then(function () {
        sending = false;
        els.send.disabled = false;
        scrollDown();
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
