/* Show Notes Generator — UI shell: language, theme, install, help, offline and update banner.
   © 2026 Graziano Melzi · OnAir Garage — MIT License */
(function () {
  "use strict";

  var VERSION = "2026.10.1";                       // keep in sync with sw.js CACHE_VERSION, the footer and README
  var STORE = "com.onairgarage.shownotesai.";
  var I18n = window.AppI18n;

  function $(id) { return document.getElementById(id); }
  function load(key, fallback) { try { var v = localStorage.getItem(STORE + key); return v === null ? fallback : v; } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(STORE + key, value); } catch (e) { /* storage unavailable */ } }

  var state = { lang: load("lang", "en"), theme: load("theme", "auto") };
  if (I18n.langs.indexOf(state.lang) === -1) state.lang = "en";      // always opens in English; only a manual choice is remembered
  if (["auto", "light", "dark"].indexOf(state.theme) === -1) state.theme = "auto";

  function t() { return I18n.t.apply(null, [state.lang].concat([].slice.call(arguments))); }

  function applyLang() {
    document.documentElement.lang = state.lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    var ph = document.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < ph.length; j++) ph[j].setAttribute("placeholder", t(ph[j].getAttribute("data-i18n-placeholder")));
    var ar = document.querySelectorAll("[data-i18n-aria]");
    for (var k = 0; k < ar.length; k++) ar[k].setAttribute("aria-label", t(ar[k].getAttribute("data-i18n-aria")));
    document.title = t("app.title");
    $("langSel").setAttribute("aria-label", t("ctl.language"));
    for (var m = 0; m < langListeners.length; m++) langListeners[m]();      // the tool re-renders what it builds from JavaScript
  }
  var langListeners = [];

  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", state.theme);
    var dark = state.theme === "dark" || (state.theme === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#1c1713" : "#f6f1e7");
  }

  // ---------- install as an app ----------
  var deferredInstall = null;
  function isInstalled() {
    if (navigator.standalone === true) return true;
    if (!window.matchMedia) return false;
    return ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"].some(function (m) { return window.matchMedia("(display-mode: " + m + ")").matches; });
  }
  function updateInstallButton() { $("installBtn").hidden = isInstalled(); }
  function openHelp(anchor) {
    var dlg = $("helpDlg");
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    var target = anchor ? $(anchor) : null;
    if (target && target.scrollIntoView) target.scrollIntoView();
  }
  function onInstallClick() {
    if (deferredInstall) {
      var ev = deferredInstall; deferredInstall = null; ev.prompt();
      if (ev.userChoice && ev.userChoice.then) ev.userChoice.then(updateInstallButton, updateInstallButton);
    } else openHelp("helpInstall");        // no native prompt (Safari, iOS, Firefox...): show the steps
  }

  // small bridge for tool.js: translations, language-change hook and the same storage helpers
  window.AppShell = { t: t, load: load, save: save, onLang: function (fn) { langListeners.push(fn); }, lang: function () { return state.lang; } };

  function init() {
    $("ver").textContent = "v" + VERSION;
    I18n.langs.forEach(function (c) { var o = document.createElement("option"); o.value = c; o.textContent = I18n.names[c]; if (c === state.lang) o.selected = true; $("langSel").appendChild(o); });
    $("themeSel").value = state.theme;
    applyTheme(); applyLang();

    $("langSel").addEventListener("change", function () { state.lang = $("langSel").value; save("lang", state.lang); applyLang(); });
    $("themeSel").addEventListener("change", function () { state.theme = $("themeSel").value; save("theme", state.theme); applyTheme(); });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", function () { if (state.theme === "auto") applyTheme(); });
    }
    var dlg = $("helpDlg");
    $("helpBtn").addEventListener("click", function () { openHelp(null); });
    $("helpClose").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredInstall = e; updateInstallButton(); });
    window.addEventListener("appinstalled", function () { deferredInstall = null; updateInstallButton(); });
    $("installBtn").addEventListener("click", onInstallClick);
    updateInstallButton();

    // offline support + "new version ready" banner (the new worker waits until the user agrees)
    if ("serviceWorker" in navigator) {
      var banner = $("updateBanner"), reloaded = false;
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").then(function (reg) {
          reg.addEventListener("updatefound", function () {
            var installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", function () {
              if (installing.state === "installed" && navigator.serviceWorker.controller) banner.classList.remove("hidden");
            });
          });
          $("updateReload").addEventListener("click", function () { if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" }); });
          $("updateDismiss").addEventListener("click", function () { banner.classList.add("hidden"); });
        }).catch(function () { /* offline support unavailable */ });
        navigator.serviceWorker.addEventListener("controllerchange", function () {
          if (reloaded) return; reloaded = true; location.reload();
        });
      });
    }
  }

  init();
})();
