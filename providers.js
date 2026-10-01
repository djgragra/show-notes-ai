/* Show Notes Generator — AI providers: how to build the request and read the reply.
   Pure functions (no network, no storage) so they can be tested with mock data.
   Endpoints, headers and field names were read from each provider's documentation (see README, "Sources to re-check").
   © 2026 Graziano Melzi · OnAir Garage — MIT License */
(function (root) {
  "use strict";

  var MAX_OUTPUT_TOKENS = 8192;      // output cap sent to providers that require one (Anthropic) or accept one (Gemini)

  // tier: "paid" = billed per use; "free" = the provider documents a free plan or free models (limits change, see the provider's site)
  var PROVIDERS = {
    anthropic: {
      id: "anthropic", name: "Anthropic (Claude)", tier: "paid", needsKey: true,
      origin: "https://api.anthropic.com", keyUrl: "https://platform.claude.com/settings/keys",
      defaultModel: "claude-sonnet-5-5", models: ["claude-sonnet-5-5", "claude-haiku-4-5-20251001", "claude-opus-5-5"]
    },
    openai: {
      id: "openai", name: "OpenAI", tier: "paid", needsKey: true,
      origin: "https://api.openai.com", keyUrl: "https://platform.openai.com/api-keys",
      defaultModel: "gpt-5.4-mini", models: ["gpt-5.4-mini", "gpt-5.5", "gpt-4.1-mini"]
    },
    gemini: {
      id: "gemini", name: "Google Gemini", tier: "free", needsKey: true, freeUsesContent: true,
      origin: "https://generativelanguage.googleapis.com", keyUrl: "https://aistudio.google.com/apikey",
      defaultModel: "gemini-3.8-flash", models: ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]
    },
    groq: {
      id: "groq", name: "Groq", tier: "free", needsKey: true,
      origin: "https://api.groq.com", keyUrl: "https://console.groq.com/keys",
      defaultModel: "openai/gpt-oss-120b", models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"]
    },
    openrouter: {
      id: "openrouter", name: "OpenRouter", tier: "free", needsKey: true,
      origin: "https://openrouter.ai", keyUrl: "https://openrouter.ai/settings/keys",
      defaultModel: "openrouter/free", models: ["openrouter/free"]
    },
    local: {
      id: "local", name: "Local (Ollama, LM Studio)", tier: "local", needsKey: false, hasBaseUrl: true,
      origin: "http://localhost", keyUrl: "",
      defaultBaseUrl: "http://localhost:11434/v1", baseUrls: ["http://localhost:11434/v1", "http://localhost:1234/v1"],
      defaultModel: "", models: []
    }
  };
  var ORDER = ["anthropic", "openai", "gemini", "groq", "openrouter", "local"];

  // The local server address must stay on this computer: the CSP only allows localhost and 127.0.0.1.
  function validLocalBaseUrl(value) {
    var u;
    try { u = new URL(String(value || "").trim()); } catch (e) { return null; }
    if (u.protocol !== "http:") return null;
    if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return null;
    if (u.username || u.password || u.search || u.hash) return null;
    return u.origin + u.pathname.replace(/\/+$/, "");
  }

  // args: { provider, key, model, system, user, baseUrl }
  // Returns { url, headers, body } — body is a JSON string. Never put the key in the URL.
  function buildRequest(args) {
    var p = PROVIDERS[args.provider];
    if (!p) throw new Error("unknown provider");
    var model = String(args.model || "").trim();
    if (!model) throw new Error("model required");
    var headers = { "Content-Type": "application/json" };
    var url, body;
    if (p.id === "anthropic") {
      url = p.origin + "/v1/messages";
      headers["x-api-key"] = args.key;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";     // required for calls from a browser page
      body = { model: model, max_tokens: MAX_OUTPUT_TOKENS, system: args.system, messages: [{ role: "user", content: args.user }] };
    } else if (p.id === "gemini") {
      url = p.origin + "/v1beta/models/" + encodeURIComponent(model.replace(/^models\//, "")) + ":generateContent";
      headers["x-goog-api-key"] = args.key;
      body = {
        systemInstruction: { parts: [{ text: args.system }] },
        contents: [{ role: "user", parts: [{ text: args.user }] }],
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS }
      };
    } else {
      // OpenAI and the providers that copy its format (Groq, OpenRouter, Ollama, LM Studio)
      if (p.id === "openai") url = p.origin + "/v1/chat/completions";
      else if (p.id === "groq") url = p.origin + "/openai/v1/chat/completions";
      else if (p.id === "openrouter") url = p.origin + "/api/v1/chat/completions";
      else {
        var base = validLocalBaseUrl(args.baseUrl);
        if (!base) throw new Error("invalid local address");
        url = base + "/chat/completions";
      }
      if (p.needsKey) headers["Authorization"] = "Bearer " + args.key;
      body = { model: model, messages: [{ role: "system", content: args.system }, { role: "user", content: args.user }] };
    }
    return { url: url, headers: headers, body: JSON.stringify(body) };
  }

  // Returns { text, truncated }. Throws Error("empty") when the reply has no text.
  function parseResponse(providerId, data) {
    var text = "", truncated = false, i;
    if (providerId === "anthropic") {
      var blocks = (data && data.content) || [];
      for (i = 0; i < blocks.length; i++) if (blocks[i] && blocks[i].type === "text" && typeof blocks[i].text === "string") text += blocks[i].text;
      truncated = !!data && data.stop_reason === "max_tokens";
    } else if (providerId === "gemini") {
      var cand = data && data.candidates && data.candidates[0];
      var parts = (cand && cand.content && cand.content.parts) || [];
      for (i = 0; i < parts.length; i++) if (parts[i] && typeof parts[i].text === "string" && !parts[i].thought) text += parts[i].text;
      truncated = !!cand && cand.finishReason === "MAX_TOKENS";
    } else {
      var choice = data && data.choices && data.choices[0];
      var content = choice && choice.message && choice.message.content;
      if (typeof content === "string") text = content;
      truncated = !!choice && choice.finish_reason === "length";
    }
    text = text.replace(/^\s+|\s+$/g, "");
    if (!text) throw new Error("empty");
    return { text: text, truncated: truncated };
  }

  // Maps an HTTP status to a message key. The provider's error body is never shown: it may echo parts of the key.
  function errorKey(status) {
    if (status === 401 || status === 403) return "err.auth";
    if (status === 402) return "err.credit";
    if (status === 413) return "err.tooLarge";
    if (status === 429) return "err.rate";
    if (status >= 500) return "err.server";
    return "err.http";
  }

  var api = { PROVIDERS: PROVIDERS, ORDER: ORDER, MAX_OUTPUT_TOKENS: MAX_OUTPUT_TOKENS, buildRequest: buildRequest, parseResponse: parseResponse, errorKey: errorKey, validLocalBaseUrl: validLocalBaseUrl };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AppProviders = api;
})(typeof self !== "undefined" ? self : this);
