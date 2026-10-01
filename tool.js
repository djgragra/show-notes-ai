/* Show Notes Generator — the tool: setup (provider, model, key), input, generation, copy.
   The API key is kept in sessionStorage by default (gone when the tab closes) and in localStorage only if the user ticks
   "Remember on this device". It is sent only to the chosen provider, never logged, never placed in a URL.
   © 2026 Graziano Melzi · OnAir Garage — MIT License */
(function () {
  "use strict";

  var Shell = window.AppShell, P = window.AppProviders, G = window.AppPrompt;
  var STORE = "com.onairgarage.shownotesai.";
  var REQUEST_TIMEOUT_MS = 300000;

  function $(id) { return document.getElementById(id); }
  function t() { return Shell.t.apply(null, arguments); }

  // ---------- storage (every access guarded: it can be blocked or empty) ----------
  function getFrom(store, key) { try { return store.getItem(STORE + key); } catch (e) { return null; } }
  function setIn(store, key, value) { try { store.setItem(STORE + key, value); return true; } catch (e) { return false; } }
  function delFrom(store, key) { try { store.removeItem(STORE + key); } catch (e) { /* ignore */ } }
  function ls() { try { return window.localStorage; } catch (e) { return null; } }
  function ss() { try { return window.sessionStorage; } catch (e) { return null; } }

  var settings = { provider: "anthropic", models: {}, baseUrl: "", format: "podcast", tone: "informative", length: "medium", outLang: "same" };
  (function loadSettings() {
    var raw = ls() && getFrom(ls(), "settings");
    if (!raw) return;
    try {
      var s = JSON.parse(raw);
      if (s && P.PROVIDERS[s.provider]) settings.provider = s.provider;
      if (s && s.models && typeof s.models === "object") settings.models = s.models;
      if (s && typeof s.baseUrl === "string") settings.baseUrl = s.baseUrl;
      if (s && G.FORMATS.indexOf(s.format) !== -1) settings.format = s.format;
      if (s && G.TONES.indexOf(s.tone) !== -1) settings.tone = s.tone;
      if (s && G.LENGTHS.indexOf(s.length) !== -1) settings.length = s.length;
      if (s && G.OUT_LANGS.indexOf(s.outLang) !== -1) settings.outLang = s.outLang;
    } catch (e) { /* ignore corrupted settings */ }
  })();
  function saveSettings() { if (ls()) setIn(ls(), "settings", JSON.stringify(settings)); }       // the API key is never part of this

  // ---------- API key: per provider; session by default, device only on request ----------
  function keyName(id) { return "key." + id; }
  function readKey(id) {
    var remembered = ls() ? getFrom(ls(), keyName(id)) : null;
    if (remembered) return { key: remembered, remembered: true };
    var session = ss() ? getFrom(ss(), keyName(id)) : null;
    return { key: session || "", remembered: false };
  }
  function writeKey(id, key, remember) {
    delFrom(ls(), keyName(id)); delFrom(ss(), keyName(id));
    if (!key) return;
    if (remember && ls()) setIn(ls(), keyName(id), key);
    else if (ss()) setIn(ss(), keyName(id), key);
  }

  // ---------- state ----------
  var busy = false, controller = null, resultKind = "";      // resultKind: "" | "notes" | "prompt"
  function prov() { return P.PROVIDERS[settings.provider]; }
  function modelFor(id) { var m = settings.models[id]; return typeof m === "string" ? m : P.PROVIDERS[id].defaultModel; }

  // ---------- status ----------
  function setStatus(text, kind) {
    var el = $("status");
    el.textContent = text || "";
    el.className = "status" + (kind ? " status--" + kind : "");
  }

  // ---------- setup ----------
  function fillProviders() {
    var sel = $("providerSel"); sel.textContent = "";
    var groups = { paid: t("tier.paid"), free: t("tier.free"), local: t("tier.local") };
    ["paid", "free", "local"].forEach(function (tier) {
      var g = document.createElement("optgroup"); g.label = groups[tier];
      P.ORDER.forEach(function (id) {
        if (P.PROVIDERS[id].tier !== tier) return;
        var o = document.createElement("option"); o.value = id; o.textContent = P.PROVIDERS[id].name; g.appendChild(o);
      });
      sel.appendChild(g);
    });
    sel.value = settings.provider;
  }

  function renderProvider() {
    var p = prov(), k = readKey(p.id);
    $("providerSel").value = p.id;
    $("modelInp").value = modelFor(p.id);
    $("modelInp").setAttribute("placeholder", p.id === "local" ? t("setup.modelLocal") : "");
    var list = $("modelList"); list.textContent = "";
    p.models.forEach(function (m) { var o = document.createElement("option"); o.value = m; list.appendChild(o); });

    $("baseRow").hidden = !p.hasBaseUrl;
    if (p.hasBaseUrl) {
      $("baseInp").value = settings.baseUrl || p.defaultBaseUrl;
      var bl = $("baseList"); bl.textContent = "";
      p.baseUrls.forEach(function (u) { var o = document.createElement("option"); o.value = u; bl.appendChild(o); });
    }

    $("keyRow").hidden = !p.needsKey;
    $("keyNote").hidden = !p.needsKey;
    $("keyInp").value = k.key;
    $("keyInp").type = "password"; $("keyShow").textContent = t("setup.show");
    $("rememberChk").checked = k.remembered;
    var link = $("keyLink");
    if (p.keyUrl) { link.href = p.keyUrl; link.hidden = false; } else { link.hidden = true; link.removeAttribute("href"); }

    var note = $("provNote"), text = "";
    if (p.id === "gemini") text = t("prov.gemini");
    else if (p.tier === "free") text = t("prov.free");
    else if (p.id === "local") text = t("prov.local");
    else text = t("prov.paid");
    note.textContent = text; note.hidden = !text;
    note.className = "note" + (p.id === "gemini" ? " note--warn" : "");
    renderSummary();
  }

  function renderSummary() {
    var p = prov(), k = readKey(p.id), parts = [p.name];
    var m = modelFor(p.id); if (m) parts.push(m);
    if (p.needsKey) parts.push(!k.key ? t("sum.noKey") : k.remembered ? t("sum.keyDevice") : t("sum.keySession"));
    $("setupSummary").textContent = "— " + parts.join(" · ");
  }

  function onProviderChange() {
    settings.provider = $("providerSel").value; saveSettings();
    renderProvider();
    $("setup").open = prov().needsKey && !readKey(settings.provider).key;
  }
  function onModelInput() { settings.models[settings.provider] = $("modelInp").value; saveSettings(); renderSummary(); }
  function onBaseInput() { settings.baseUrl = $("baseInp").value; saveSettings(); }
  function onKeyInput() {
    writeKey(settings.provider, $("keyInp").value.trim(), $("rememberChk").checked);
    renderSummary();
  }
  function onRememberChange() {
    var key = $("keyInp").value.trim();
    writeKey(settings.provider, key, $("rememberChk").checked);
    renderSummary();
  }
  function onForget() {
    writeKey(settings.provider, "", false);
    $("keyInp").value = ""; $("rememberChk").checked = false;
    renderSummary(); setStatus(t("setup.forgotten"), "ok");
  }
  function onShowKey() {
    var inp = $("keyInp"), hidden = inp.type === "password";
    inp.type = hidden ? "text" : "password";
    $("keyShow").textContent = hidden ? t("setup.hide") : t("setup.show");
  }

  // ---------- input ----------
  function currentOpts() {
    return { text: $("srcInp").value, format: $("formatSel").value, length: $("lengthSel").value, tone: $("toneSel").value, outLang: $("outLangSel").value };
  }
  function renderCount() {
    var text = $("srcInp").value, trimmed = text.trim();
    var words = trimmed ? trimmed.split(/\s+/).length : 0;
    var tokens = G.estimateTokens(text);
    $("srcCount").textContent = t("src.count", text.length.toLocaleString(Shell.lang()), words.toLocaleString(Shell.lang()), tokens.toLocaleString(Shell.lang()));
    var warn = $("srcWarn");
    if (tokens > G.LARGE_INPUT_TOKENS) { warn.textContent = t("src.large"); warn.hidden = false; } else warn.hidden = true;
  }
  function onOptChange() {
    settings.format = $("formatSel").value; settings.tone = $("toneSel").value; settings.length = $("lengthSel").value; settings.outLang = $("outLangSel").value;
    saveSettings();
  }

  // ---------- result ----------
  function showResult(kind, text, truncated) {
    resultKind = kind;
    $("resultCard").hidden = false;
    $("outTxt").value = text;
    $("outLabel").textContent = t(kind === "prompt" ? "out.promptLabel" : "out.label");
    var note = $("outNote");
    if (kind === "prompt") { note.textContent = t("out.promptNote"); note.hidden = false; }
    else if (truncated) { note.textContent = t("out.truncated"); note.hidden = false; }
    else note.hidden = true;
    try { $("resultCard").scrollIntoView({ block: "start", behavior: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } catch (e) { /* ignore */ }
  }
  function renderResultLabel() {
    if (!resultKind) return;
    $("outLabel").textContent = t(resultKind === "prompt" ? "out.promptLabel" : "out.label");
    if (resultKind === "prompt") $("outNote").textContent = t("out.promptNote");
  }

  function copyText(text, okKey) {
    function done() { setStatus(t(okKey), "ok"); }
    function fallback() {
      var ta = $("outTxt"), prev = ta.value;
      try { ta.value = text; ta.select(); document.execCommand("copy"); done(); } catch (e) { setStatus(t("err.copy"), "err"); }
      ta.value = prev;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  // ---------- generate ----------
  function setBusy(on) {
    busy = on;
    $("genBtn").disabled = on; $("promptBtn").disabled = on;
    $("stopBtn").hidden = !on;
  }

  function validate() {
    var p = prov(), o = currentOpts();
    if (!o.text.trim()) return { key: "err.noText", focus: "srcInp" };
    if (p.needsKey && !$("keyInp").value.trim()) return { key: "err.noKey", focus: "keyInp", open: true };
    if (!$("modelInp").value.trim()) return { key: "err.noModel", focus: "modelInp", open: true };
    if (p.hasBaseUrl && !P.validLocalBaseUrl($("baseInp").value)) return { key: "err.badBase", focus: "baseInp", open: true };
    return null;
  }

  function generate() {
    if (busy) return;
    var bad = validate();
    if (bad) {
      setStatus(t(bad.key), "err");
      if (bad.open) $("setup").open = true;
      $(bad.focus).focus();
      return;
    }
    var p = prov(), o = currentOpts(), prompt = G.buildPrompt(o), req;
    try {
      req = P.buildRequest({ provider: p.id, key: $("keyInp").value.trim(), model: $("modelInp").value, system: prompt.system, user: prompt.user, baseUrl: $("baseInp").value });
    } catch (e) { setStatus(t("err.badBase"), "err"); return; }

    controller = new AbortController();
    var timedOut = false, timer = setTimeout(function () { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT_MS);
    setBusy(true);
    setStatus(t("status.writing", p.name), "");

    fetch(req.url, { method: "POST", headers: req.headers, body: req.body, signal: controller.signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
      .then(function (res) {
        if (!res.ok) { var err = new Error("http"); err.status = res.status; throw err; }
        return res.json();
      })
      .then(function (data) {
        var r = P.parseResponse(p.id, data);
        showResult("notes", r.text, r.truncated);
        setStatus(t("status.done"), "ok");
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") setStatus(t(timedOut ? "err.timeout" : "err.stopped"), timedOut ? "err" : "");
        else if (e && e.message === "http") setStatus(t(P.errorKey(e.status), e.status), "err");
        else if (e && e.message === "empty") setStatus(t("err.empty"), "err");
        else if (e instanceof SyntaxError) setStatus(t("err.badReply"), "err");
        else setStatus(t(p.id === "local" ? "err.networkLocal" : "err.network", p.name), "err");        // network, CORS or a blocker; the browser does not say which
      })
      .then(function () { clearTimeout(timer); controller = null; setBusy(false); });
  }

  function copyPrompt() {
    if (!$("srcInp").value.trim()) { setStatus(t("err.noText"), "err"); $("srcInp").focus(); return; }
    var text = G.buildCopyPrompt(currentOpts());
    showResult("prompt", text, false);
    copyText(text, "status.promptCopied");
  }

  // ---------- init ----------
  function applyOptions() {
    $("formatSel").value = settings.format; $("toneSel").value = settings.tone; $("lengthSel").value = settings.length; $("outLangSel").value = settings.outLang;
  }
  function init() {
    fillProviders(); applyOptions(); renderProvider(); renderCount();
    $("setup").open = prov().needsKey && !readKey(settings.provider).key;

    $("providerSel").addEventListener("change", onProviderChange);
    $("modelInp").addEventListener("input", onModelInput);
    $("baseInp").addEventListener("input", onBaseInput);
    $("keyInp").addEventListener("input", onKeyInput);
    $("rememberChk").addEventListener("change", onRememberChange);
    $("keyForget").addEventListener("click", onForget);
    $("keyShow").addEventListener("click", onShowKey);
    $("srcInp").addEventListener("input", renderCount);
    $("srcInp").addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); generate(); } });
    $("srcClear").addEventListener("click", function () { $("srcInp").value = ""; renderCount(); $("srcInp").focus(); });
    ["formatSel", "toneSel", "lengthSel", "outLangSel"].forEach(function (id) { $(id).addEventListener("change", onOptChange); });
    $("genBtn").addEventListener("click", generate);
    $("promptBtn").addEventListener("click", copyPrompt);
    $("stopBtn").addEventListener("click", function () { if (controller) controller.abort(); });
    $("copyBtn").addEventListener("click", function () { copyText($("outTxt").value, resultKind === "prompt" ? "status.promptCopied" : "status.copied"); });

    Shell.onLang(function () { fillProviders(); renderProvider(); renderCount(); renderResultLabel(); setStatus("", ""); });
  }

  init();
})();
