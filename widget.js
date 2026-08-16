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
    var lines = String(text || "").replace(/\r/g, "").split("\n");

    // Pull out the ::SUGGEST:: line(s).
    var kept = [];
    lines.forEach(function (ln) {
      var m = ln.match(/^\s*::SUGGEST::\s*(.*)$/i);
      if (m) {
        m[1].split("::").forEach(function (opt) {
          var t = opt.trim();
          if (t) suggestions.push(t);
        });
      } else {
        kept.push(ln);
      }
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

    return { html: html || "<p></p>", suggestions: suggestions.slice(0, 4) };
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
      '<button type="submit"></button></form>';

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
    if (out.suggestions.length) appendChips(out.suggestions);
  }

  function userBubble(text) {
    var div = document.createElement("div");
    div.className = "mrv-msg mrv-user";
    div.setAttribute("dir", isRTL(text) ? "rtl" : "ltr");
    div.textContent = text; // escaped by textContent — never rendered as markdown
    els.body.appendChild(div);
  }

  function appendChips(items) {
    var wrap = document.createElement("div");
    wrap.className = "mrv-quick";
    wrap.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    items.forEach(function (q) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "mrv-chip";
      chip.textContent = q;
      chip.addEventListener("click", function () { submitMessage(q); });
      wrap.appendChild(chip);
    });
    els.body.appendChild(wrap);
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
