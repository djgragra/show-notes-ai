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
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) if (!/^(https?:|mailto:|#)/.test(m[1])) assert.ok(!m[1].startsWith("/"), m[1]);
});

test("every script and asset used by the page is in the service worker precache", () => {
  const sw = read("sw.js"), html = read("index.html");
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
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
