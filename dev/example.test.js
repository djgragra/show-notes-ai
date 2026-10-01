"use strict";
// Translations: same keys in every language, same {n} placeholders, and every key used by the page or by tool.js exists.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const I18n = require("../i18n.js");
const root = path.join(__dirname, "..");

test("every language has the same translation keys as English", () => {
  const en = Object.keys(I18n.strings.en);
  for (const l of ["it", "es"]) assert.deepEqual(Object.keys(I18n.strings[l]).sort(), en.slice().sort(), l);
});

test("every language uses the same {n} placeholders as English", () => {
  const ph = (s) => (s.match(/\{\d+\}/g) || []).sort().join(",");
  for (const k of Object.keys(I18n.strings.en)) for (const l of ["it", "es"]) assert.equal(ph(I18n.strings[l][k]), ph(I18n.strings.en[k]), l + " " + k);
});

test("no empty strings", () => {
  for (const l of I18n.langs) for (const [k, v] of Object.entries(I18n.strings[l])) assert.ok(v.trim().length > 0, l + " " + k);
});

test("keys used in index.html and tool.js exist", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const tool = fs.readFileSync(path.join(root, "tool.js"), "utf8");
  const prov = fs.readFileSync(path.join(root, "providers.js"), "utf8");
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-placeholder|-aria)?="([^"]+)"/g)) used.add(m[1]);
  for (const m of tool.matchAll(/\bt\("([a-zA-Z0-9.]+)"/g)) used.add(m[1]);
  for (const m of tool.matchAll(/"(err\.[a-zA-Z]+|out\.[a-zA-Z]+|status\.[a-zA-Z]+)"/g)) used.add(m[1]);
  for (const m of prov.matchAll(/"(err\.[a-zA-Z]+)"/g)) used.add(m[1]);
  for (const k of used) assert.ok(k in I18n.strings.en, "missing key: " + k);
});

test("app opens in English: no language detection in the scripts", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8") + fs.readFileSync(path.join(root, "tool.js"), "utf8");
  assert.ok(!/navigator\.language/.test(app));
});

test("the generic HTTP error message mentions the API key (some providers answer 400 for a bad key)", () => {
  assert.match(I18n.strings.en["err.http"], /API key/); assert.match(I18n.strings.it["err.http"], /chiave API/); assert.match(I18n.strings.es["err.http"], /clave API/);
});
