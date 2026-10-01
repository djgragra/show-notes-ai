"use strict";
// Request building and reply parsing for each provider, with mock data only (no network, no keys).
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../providers.js");

const FAKE = "test-key-not-real";
const base = { key: FAKE, model: "some-model", system: "SYS", user: "USER" };

test("anthropic: endpoint, headers, body", () => {
  const r = P.buildRequest({ ...base, provider: "anthropic" });
  assert.equal(r.url, "https://api.anthropic.com/v1/messages");
  assert.equal(r.headers["x-api-key"], FAKE);
  assert.equal(r.headers["anthropic-version"], "2023-06-01");
  assert.equal(r.headers["anthropic-dangerous-direct-browser-access"], "true");
  const b = JSON.parse(r.body);
  assert.equal(b.model, "some-model"); assert.equal(b.system, "SYS"); assert.equal(b.max_tokens, P.MAX_OUTPUT_TOKENS);
  assert.deepEqual(b.messages, [{ role: "user", content: "USER" }]);
});

test("openai, groq, openrouter: endpoint, bearer header, messages", () => {
  const urls = { openai: "https://api.openai.com/v1/chat/completions", groq: "https://api.groq.com/openai/v1/chat/completions", openrouter: "https://openrouter.ai/api/v1/chat/completions" };
  for (const id of Object.keys(urls)) {
    const r = P.buildRequest({ ...base, provider: id });
    assert.equal(r.url, urls[id], id);
    assert.equal(r.headers.Authorization, "Bearer " + FAKE, id);
    assert.deepEqual(JSON.parse(r.body).messages, [{ role: "system", content: "SYS" }, { role: "user", content: "USER" }], id);
  }
});

test("gemini: key in a header, never in the URL; model name encoded", () => {
  const r = P.buildRequest({ ...base, provider: "gemini", model: "models/gemini-3.8-flash" });
  assert.equal(r.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");
  assert.equal(r.headers["x-goog-api-key"], FAKE);
  const b = JSON.parse(r.body);
  assert.equal(b.systemInstruction.parts[0].text, "SYS");
  assert.equal(b.contents[0].parts[0].text, "USER");
  assert.equal(b.generationConfig.maxOutputTokens, P.MAX_OUTPUT_TOKENS);
});

test("the key never appears in any URL or body", () => {
  for (const id of P.ORDER) {
    const r = P.buildRequest({ ...base, provider: id, baseUrl: "http://localhost:11434/v1" });
    assert.ok(!r.url.includes(FAKE), id + " url");
    assert.ok(!r.body.includes(FAKE), id + " body");
  }
});

test("local: no key header, address must be localhost or 127.0.0.1 over http", () => {
  const r = P.buildRequest({ ...base, provider: "local", key: "", baseUrl: "http://localhost:11434/v1/" });
  assert.equal(r.url, "http://localhost:11434/v1/chat/completions");
  assert.equal(r.headers.Authorization, undefined);
  assert.equal(P.buildRequest({ ...base, provider: "local", baseUrl: "http://127.0.0.1:1234/v1" }).url, "http://127.0.0.1:1234/v1/chat/completions");
  for (const bad of ["https://localhost:1/v1", "http://example.com/v1", "http://localhost.evil.com/v1", "http://user:pw@localhost/v1", "http://localhost:1234/v1?x=1", "ftp://localhost", "", "not a url", "http://[::1]:11434/v1"])
    assert.equal(P.validLocalBaseUrl(bad), null, bad);
  assert.throws(() => P.buildRequest({ ...base, provider: "local", baseUrl: "http://example.com/v1" }));
});

test("model is required; unknown provider is refused", () => {
  assert.throws(() => P.buildRequest({ ...base, provider: "openai", model: "  " }));
  assert.throws(() => P.buildRequest({ ...base, provider: "nope" }));
});

test("parse: anthropic text blocks, truncation flag", () => {
  const ok = P.parseResponse("anthropic", { content: [{ type: "text", text: "Hello " }, { type: "tool_use" }, { type: "text", text: "world" }], stop_reason: "end_turn" });
  assert.deepEqual(ok, { text: "Hello world", truncated: false });
  assert.equal(P.parseResponse("anthropic", { content: [{ type: "text", text: "cut" }], stop_reason: "max_tokens" }).truncated, true);
});

test("parse: openai-style reply, truncation flag", () => {
  for (const id of ["openai", "groq", "openrouter", "local"]) {
    assert.deepEqual(P.parseResponse(id, { choices: [{ message: { content: "  Hi  " }, finish_reason: "stop" }] }), { text: "Hi", truncated: false }, id);
    assert.equal(P.parseResponse(id, { choices: [{ message: { content: "x" }, finish_reason: "length" }] }).truncated, true, id);
  }
});

test("parse: gemini parts, thought parts skipped, truncation flag", () => {
  const r = P.parseResponse("gemini", { candidates: [{ content: { parts: [{ text: "thinking", thought: true }, { text: "A" }, { text: "B" }] }, finishReason: "STOP" }] });
  assert.deepEqual(r, { text: "AB", truncated: false });
  assert.equal(P.parseResponse("gemini", { candidates: [{ content: { parts: [{ text: "x" }] }, finishReason: "MAX_TOKENS" }] }).truncated, true);
});

test("parse: empty or malformed replies throw 'empty'", () => {
  const bad = [["anthropic", {}], ["anthropic", { content: [] }], ["openai", { choices: [] }], ["openai", { choices: [{ message: { content: null } }] }], ["gemini", { candidates: [] }], ["gemini", null]];
  for (const [id, d] of bad) assert.throws(() => P.parseResponse(id, d), /empty/, id);
});

test("error keys by HTTP status never carry the provider's body", () => {
  assert.equal(P.errorKey(401), "err.auth"); assert.equal(P.errorKey(403), "err.auth"); assert.equal(P.errorKey(402), "err.credit");
  assert.equal(P.errorKey(413), "err.tooLarge"); assert.equal(P.errorKey(429), "err.rate"); assert.equal(P.errorKey(503), "err.server"); assert.equal(P.errorKey(400), "err.http");
});

test("provider table: every remote provider has a default model that is in its list", () => {
  for (const id of P.ORDER) {
    const p = P.PROVIDERS[id];
    if (id === "local") continue;
    assert.ok(p.models.includes(p.defaultModel), id);
    assert.ok(/^https:\/\/[a-z0-9.-]+$/.test(p.origin), id);
  }
});
