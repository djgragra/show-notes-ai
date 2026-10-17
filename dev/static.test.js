"use strict";
// Static-app rules: strict CSP, no inline code, versions aligned, precache complete, CSP matches the provider list, contrast.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const P = require("../providers.js");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

test("CSP: connect-src lists exactly the provider origins plus localhost", () => {
  const html = read("index.html");
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  const connect = csp.match(/connect-src ([^;]+)/)[1].split(/\s+/).sort();
  const expected = ["'self'", "http://127.0.0.1:*", "http://localhost:*"].concat(P.ORDER.filter((i) => i !== "local").map((i) => P.PROVIDERS[i].origin)).sort();
  assert.deepEqual(connect, expected);
  assert.match(csp, /script-src 'self'(;|$)/); assert.match(csp, /style-src 'self'(;|$)/);
  assert.ok(!/unsafe-inline|unsafe-eval|\*\s*;/.test(csp.replace(/:\*/g, "")));
});

test("no inline scripts, styles or handlers; relative paths only", () => {
  const html = read("index.html");
  assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(html), "inline script");
  assert.ok(!/<style/.test(html), "style tag");
  assert.ok(!/\sstyle=/.test(html), "style attribute");
  assert.ok(!/\son[a-z]+=/.test(html), "event handler attribute");
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) if (!/^(https?:|mailto:|#)/.test(m[1])) assert.ok(!m[1].startsWith("/"), m[1]);
});

test("every script and asset used by the page is in the service worker precache", () => {
  const sw = read("sw.js"), html = read("index.html");
  for (const m of html.matchAll(/\s(?:src|href)="([^"#]+)"/g)) {     // attributes only, not data-i18n-href
    if (/^(https?:|mailto:)/.test(m[1])) continue;
    assert.ok(sw.includes('"./' + m[1] + '"'), "not precached: " + m[1]);
  }
});

test("version is the same in app.js, sw.js, README and manifest id is right", () => {
  const v = read("app.js").match(/VERSION = "([^"]+)"/)[1];
  assert.match(v, /^\d{4}\.\d{1,2}\.\d+$/); assert.notEqual(v, "1.0.0");
  assert.ok(read("sw.js").includes('CACHE_VERSION = "v' + v + '"'));
  assert.ok(read("README.md").includes(v));
  const m = JSON.parse(read("manifest.json"));
  assert.equal(m.id, "com.onairgarage.shownotesai"); assert.equal(m.start_url, "./"); assert.equal(m.scope, "./");
});

test("API key handling: never logged, never in a URL", () => {
  const tool = read("tool.js");
  assert.ok(!/console\./.test(tool), "no console output in tool.js");
  assert.ok(!/[?&]key=/.test(read("providers.js") + tool));
});

function lum(hex) { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function ratio(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

test("contrast: text, muted text, accent and button text meet WCAG AA (4.5:1) in both themes", () => {
  const css = read("style.css");
  const light = css.match(/^:root \{[^}]+\}/m)[0], dark = css.match(/:root\[data-theme="dark"\] \{([^}]+)\}/)[1];
  const v = (block, name) => block.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})"))[1];
  for (const [label, block] of [["light", light], ["dark", dark]]) {
    for (const bg of ["bg", "panel"]) for (const fg of ["ink", "ink2", "accent", "warn", "over", "ok"]) assert.ok(ratio(v(block, fg), v(block, bg)) >= 4.5, label + " " + fg + " on " + bg + " = " + ratio(v(block, fg), v(block, bg)).toFixed(2));
    assert.ok(ratio(v(block, "accent-ink"), v(block, "accent")) >= 4.5, label + " button text");
  }
});

test("tip card: texts in the three languages, the jar and the pill go to the support page in the app's language", () => {
  const I18n = require("../i18n.js");
  const expected = {
    en: ["Useful to you? A coffee for the mechanics is always welcome.", "Tip jar", "https://onairgarage.com/support/"],
    it: ["Ti è utile? Un caffè per i meccanici è sempre ben accetto.", "Salvadanaio", "https://onairgarage.com/it/support/"],
    es: ["¿Te resulta útil? Un café para los mecánicos siempre es bienvenido.", "Hucha", "https://onairgarage.com/es/support/"]
  };
  for (const l of ["en", "it", "es"]) {
    const [text, btn, url] = expected[l];
    assert.equal(I18n.strings[l]["tip.text"], text, l); assert.equal(I18n.strings[l]["tip.btn"], btn, l); assert.equal(I18n.strings[l]["tip.url"], url, l);
  }
  const html = read("index.html");
  const tip = html.match(/<aside class="tip">[\s\S]*?<\/aside>/)[0];
  const links = [...tip.matchAll(/<a [^>]+>/g)].map((m) => m[0]);
  assert.equal(links.length, 2, "the jar and the pill");
  for (const a of links) {
    assert.match(a, /data-i18n-href="tip\.url"/); assert.match(a, /target="_blank"/); assert.match(a, /rel="noopener"/);
    assert.match(a, /href="https:\/\/onairgarage\.com\/support\/"/, "English address when scripts do not run");
  }
  assert.match(links[0], /tabindex="-1"/); assert.match(links[0], /aria-hidden="true"/);   // the jar is a second link, the pill is the one for keyboards and screen readers
  assert.match(tip, /<img [^>]*alt=""/, "the jar is decorative");
  assert.ok(fs.existsSync(path.join(root, "icons/tip-jar.webp")));
  assert.match(read("sw.js"), /"\.\/icons\/tip-jar\.webp"/, "the jar is precached: the card shows offline");
  assert.match(read("app.js"), /data-i18n-href/, "the address follows the language");
  assert.ok(!/popup|setInterval|setTimeout/.test(tip), "no pop-up or timer in the card");
});

test("manifest: a wide and a narrow screenshot, declared with their real size", () => {
  const m = JSON.parse(read("manifest.json"));
  const forms = (m.screenshots || []).map((s) => s.form_factor).sort();
  assert.deepEqual(forms, ["narrow", "wide"]);
  for (const s of m.screenshots) {
    assert.equal(s.type, "image/png"); assert.ok(s.label && s.label.length > 5);
    const buf = fs.readFileSync(path.join(root, s.src));
    assert.equal(buf.toString("latin1", 1, 4), "PNG");
    assert.equal(buf.readUInt32BE(16) + "x" + buf.readUInt32BE(20), s.sizes, s.src);
  }
});

test("touch screens: the 44 px rule is in the style sheet and does not touch the computer look", () => {
  const css = read("style.css");
  const block = css.match(/@media \(pointer: coarse\) \{([\s\S]*?)\n\}/)[1];
  assert.match(block, /\.check \{[^}]*min-width: 44px/);
  assert.match(block, /\.foot__line a \{[^}]*min-height: 44px/);
  assert.match(block, /\.tip__btn \{[^}]*min-height: 44px/);
  assert.match(block, /\.skip \{[^}]*min-height: 44px/);
});

test("release workflow: manual, on main, the version must equal the code and be new", () => {
  const wf = read(".github/workflows/release.yml");
  assert.match(wf, /workflow_dispatch:/); assert.match(wf, /release_version:/); assert.match(wf, /required: true/);
  assert.match(wf, /GITHUB_REF_NAME" != "main"/); assert.match(wf, /refs\/tags\/v\$TAG/);
  assert.match(wf, /node --test dev\/\*\.test\.js/); assert.match(wf, /softprops\/action-gh-release@v3/);
  assert.match(wf, /contents: write/);
});
