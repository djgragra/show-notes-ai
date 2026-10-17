# Show Notes Generator

Turn a radio show transcript or outline into ready-to-publish show notes with the AI provider of your choice. Free, offline-capable web app (PWA) from [OnAir Garage](https://onairgarage.com).

- Tool page: https://onairgarage.com/tools/show-notes-ai/
- Web app: https://onairgarage.com/apps/show-notes-ai/
- Author: Graziano Melzi · OnAir Garage — hello@onairgarage.com
- License: MIT (see `LICENSE`)
- Version: 2026.10.3

## What it does

Paste a transcript or a running order, choose what to write (podcast description, website show notes, social posts), the tone (informative or promotional), the length and the output language, and press **Write the show notes**. The text can be edited and copied. No API key? **Copy prompt instead** builds the full prompt to paste into Claude, ChatGPT or any other assistant.

- **Providers** (chosen in Setup): Anthropic (Claude) and OpenAI (paid); Google Gemini, Groq and OpenRouter (documented free plan or free models); a local server (Ollama, LM Studio) on this computer.
- **Bring your own key.** The app calls the provider directly from the browser; there is no OnAir Garage server in between. The API key is kept in `sessionStorage` by default (gone when the tab closes) and in `localStorage` only if the user ticks "Remember on this device" (unencrypted, readable by anyone using that browser profile; the app says so). It is sent only to the chosen provider, never logged, never placed in a URL, and never written into the saved settings.
- The transcript is never saved. Errors show the HTTP status only, never the provider's error body (it may echo part of a key).
- The instructions tell the model to use only what is in the source, to leave `[placeholders]` for missing facts, and to treat the transcript as material, not as commands. The result still has to be read by a person before publishing.
- Languages: English, Italiano, Español. The app always opens in English; a manual change is remembered on the device. Theme: light, dark, or follow the system. Installable as an app (Install app button; Share → Add to Home Screen on iPhone/iPad; File → Add to Dock on Safari for Mac), works offline for the app itself (writing needs a connection to the provider), shows an "update available" banner.

Not included, on purpose: history of results, accounts, e-mail/Telegram notifications (the tool has no events to report), streaming, automatic splitting of very long texts, a custom (non-local) endpoint (the strict CSP lists only the providers above).

## Provider interfaces and sources

Status: **official** = read in the provider's own documentation or official repository; **observed** = checked by a real request (no key, no text) but not stated in the documentation I could read; **recommended** = common practice, no official documentation.

| Item | Value used | Source (read 2026-10-01) | Status |
|---|---|---|---|
| Anthropic endpoint and auth | `POST https://api.anthropic.com/v1/messages`; headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type` | API overview, platform.claude.com/docs/en/api/overview (base URL, header table) | official |
| Anthropic body and reply | `model`, `max_tokens`, `system`, `messages`; text in `content[].text`; `stop_reason: max_tokens` = cut off | Messages reference, platform.claude.com/docs/en/api/messages (the fetched page showed a different host in its example; `api.anthropic.com` is the one in the API overview and the one that answers real requests) | official |
| Anthropic from a browser | header `anthropic-dangerous-direct-browser-access: true` | Not found on the official pages read; preflight accepts it and a real call (invalid key) returns `access-control-allow-origin` (`dev/check-cors.sh`) | observed |
| Anthropic models | `claude-sonnet-5-5` (default), `claude-haiku-4-5-20251001`, `claude-opus-5-5` | Models overview, platform.claude.com/docs/en/about-claude/models/overview | official |
| OpenAI endpoint and auth | `POST https://api.openai.com/v1/chat/completions`; `Authorization: Bearer`; text in `choices[0].message.content`; `finish_reason: length` = cut off | OpenAPI spec `openai/openai-openapi` (`manual_spec`, version 2.3.0). The docs site answered 403 to automated reading and was **not** bypassed | official (spec) |
| OpenAI models | `gpt-5.4-mini` (default), `gpt-5.5`, `gpt-4.1-mini` | `openai-python` `chat_model.py` (official SDK list of model names) | official (list only; suitability and prices not read) |
| Gemini endpoint and body | `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`; `systemInstruction`, `contents`, `generationConfig.maxOutputTokens`; text in `candidates[0].content.parts[].text` | ai.google.dev/api/generate-content | official |
| Gemini key | header `x-goog-api-key` (never `?key=`, so the key stays out of URLs) | ai.google.dev/gemini-api/docs/api-key | official |
| Gemini free tier and data use | models listed "Free of charge"; free-tier content "used to improve our products" (shown as a warning in the app) | ai.google.dev/gemini-api/docs/pricing | official |
| Gemini models | `gemini-3.8-flash` (default), `gemini-3.5-flash-lite`, `gemini-2.5-flash` | ai.google.dev/gemini-api/docs/models and pricing | official |
| Groq endpoint and auth | `POST https://api.groq.com/openai/v1/chat/completions`; `Authorization: Bearer` | console.groq.com/docs/api-reference | official |
| Groq free plan and models | a free plan exists; limits differ by model and are shown in the user's console; production models `openai/gpt-oss-120b` (default), `openai/gpt-oss-20b`, `llama-3.3-70b-versatile` | console.groq.com/docs/rate-limits and /docs/models | official |
| OpenRouter endpoint and auth | `POST https://openrouter.ai/api/v1/chat/completions`; `Authorization: Bearer` | openrouter.ai/docs/api-reference/overview | official |
| OpenRouter free models | `:free` suffix and the router `openrouter/free` (default); limits depend on credits (shown by OpenRouter) | openrouter.ai/docs/faq | official |
| Ollama | `http://localhost:11434/v1/chat/completions`; key not needed locally; default allowed origins are 127.0.0.1 and 0.0.0.0, so `OLLAMA_ORIGINS` must include the page's origin | docs.ollama.com/api/openai-compatibility and /faq | official |
| LM Studio | `http://localhost:1234/v1` | lmstudio.ai/docs/developer/openai-compat | official (port); its CORS setting was **not** found in the pages read |
| Output length targets | podcast 60–100 / 150–250 / 300–450 words; website 150–250 / 300–450 / 600–900 words; social 1 / 3 / 5 posts | none | recommended |
| Output cap | 8192 tokens (sent to Anthropic, which requires a cap, and to Gemini) | none | recommended |
| Token estimate and warning | about 4 characters per token; warning above 100,000 estimated tokens | none | recommended |

Mistral was left out of v1: its free-tier terms and current model aliases could not be read from the primary documentation (one page 404, the others did not list them). Adding a provider is one entry in `providers.js` plus its origin in the CSP.

## Assumptions and limits

- The reply arrives in one piece (no streaming); the request stops after 5 minutes. Long texts on free plans can hit per-minute token limits (HTTP 429 or 413, shown with a clear message).
- The token count is an estimate. Models have different context windows (not all were read), so the app only warns on very long texts and does not split them.
- Model names change often; the field is editable and the suggestions are the ones read on the date above.
- Free plans and prices change: the app points to the provider and states no figures.
- A local server must allow the page's origin (CORS). Calling `http://localhost` from an `https` page may be blocked by some browsers; this was **not** tested in Safari or on iPhone.
- The API key in `localStorage` (when remembered) is readable by any script running on this origin. The strict CSP (no inline code, no third-party scripts) limits that risk but does not remove it.

## Validation and references

Results as of October 2026. This is not a certified tool; it does not validate the quality or accuracy of any model's text.

| Reference | What it validates | Result | How to re-run |
|---|---|---|---|
| Mock data per provider (`dev/providers.test.js`) | Request URL, headers and body for each provider; reply parsing; truncation flags; empty/malformed replies; the key never in a URL or body; local address limited to localhost | 12 tests pass | `node --test dev/providers.test.js` |
| Prompt tests (`dev/prompt.test.js`) | Transcript only in the user message; safety rules always present; options change the instructions; fallbacks | 7 tests pass | `node --test dev/prompt.test.js` |
| Static-app rules (`dev/static.test.js`) | CSP `connect-src` equals the provider list; no inline code; relative paths; precache complete; versions aligned; no `console` in the tool; WCAG AA contrast (≥ 4.5:1) of text, accent and button colours in both themes; the tip card (texts in en/it/es, the jar and the pill link to the support page of the site in the app's language, jar precached); the manifest screenshots and their real size; the 44 px rule for touch screens in the style sheet; the release workflow | 10 tests pass | `node --test dev/static.test.js` |
| Translations (`dev/example.test.js`) | Same keys and placeholders in en/it/es; every key used by the page exists; the generic HTTP error message mentions the API key | 6 tests pass | `node --test dev/example.test.js` |
| Touch targets and desktop look (Playwright, 2026-10-17) | With a touch emulation (`pointer: coarse`, 375 px) every button, link, select, summary, text field and the label of the "Remember" box measures at least 44 × 44 px (before: the box itself 22 × 22, the footer links 21 px high); on a computer (1280 px) the page above the footer is identical pixel by pixel before and after; no horizontal scroll at 375 px; no console errors | pass (manual run) | not scripted |
| Providers' CORS (`dev/check-cors.sh`) | Each provider answers the browser preflight from `https://onairgarage.com` and allows the headers the app sends (no key and no text sent) | 5/5 pass on 2026-10-01 | `bash dev/check-cors.sh` |
| Browser run with a mock server (`dev/serve.js`) | Whole flow through the UI with the "Local" provider: success, 401, 429, cut-off reply, stop, copy prompt, bad address, unreachable server; key storage (session / remembered / forgotten); the call built for Anthropic captured with a stubbed `fetch`; 375, 768 px and desktop, light and dark, no horizontal scroll, touch targets ≥ 44 px | pass (manual run, 2026-10-01) | `node dev/serve.js`, open `http://localhost:8123`, choose Local with address `http://localhost:8124/v1` |

**Not validated:** touch use on a real phone or tablet (the 44 px rule was measured with an emulated touch screen); the look of the install dialog with the screenshots on Android and iOS; live calls to any provider with a real key (none was used in development); the quality, accuracy or tone of any model's output; Safari, iPhone and Android behaviour; installation and offline use on real devices; a local Ollama or LM Studio server called from the deployed page. These are left to testing on real devices and accounts.

## Sources to re-check

Last read on 2026-10-01:

| Document | Version read |
|---|---|
| Claude API overview and Messages reference (platform.claude.com/docs/en/api) | current page; `anthropic-version` 2023-06-01 |
| Claude models overview | Claude Sonnet 5.5, Opus 5.5, Fable 5.1, Haiku 4.5 |
| OpenAI OpenAPI spec (`openai/openai-openapi`, branch `manual_spec`) | info version 2.3.0 |
| `openai-python` `src/openai/types/shared/chat_model.py` | `main` branch |
| Gemini API: generateContent, API key, models, pricing (ai.google.dev) | current pages |
| Groq: API reference, rate limits, models (console.groq.com/docs) | current pages |
| OpenRouter: API reference overview, FAQ (openrouter.ai/docs) | current pages |
| Ollama: OpenAI compatibility, FAQ (docs.ollama.com) | current pages |
| LM Studio: OpenAI compatibility (lmstudio.ai/docs) | current page |
| Not readable: platform.openai.com/docs (HTTP 403 to automated reading, not bypassed); Mistral free tier and model aliases | — |

Pages the documentation does not version were read as shown on that date. Re-check model names, free-tier terms and data-use statements before each release.

## Run locally

Static files, no build step. Serve the folder with any web server (service workers need `http://localhost` or HTTPS):

```bash
python3 -m http.server 8000
```

Tests (Node 18+): `node --test dev/*.test.js`. To try the whole flow without a key, run `node dev/serve.js` (app on port 8123, mock provider on 8124) and choose **Local** in Setup with the address `http://localhost:8124/v1` and any model name. The mock answers `FAIL401`, `FAIL429`, `SLOW` and `LENGTH` test words.

## Structure

- `index.html`, `style.css`, `app.js` (shell: language, theme, install, update), `tool.js` (setup, key, generation, copy), `providers.js` (requests and replies per provider), `prompt.js` (instructions for the model), `i18n.js`, `sw.js`, `manifest.json`, `icons/` (with the tip jar), `screenshots/` (the two pictures the browser shows when you install the app: wide and narrow, made from the app with invented text) — the app (served under `/apps/show-notes-ai/`).
- `dev/` — tests, mock server, CORS check and the icon generator; not deployed.
- `.github/workflows/` — `ci.yml` (tests on every pull request) and `release.yml` (started by hand on `main` with the version: checks that it is the one in `app.js` and `sw.js`, runs the tests, creates the tag and the release).

Static-app constraints: relative paths only, strict CSP (no inline scripts or styles; `connect-src` lists only the provider origins and localhost), service worker scoped to the app folder. Bump `CACHE_VERSION` in `sw.js` and `VERSION` in `app.js` on every release. Versions are `year.month.number` (e.g. `2026.10.3`), tags `v2026.10.3`, created by the `Release` workflow.

## Credits

No third-party fonts, scripts or images: the type is the system serif and sans-serif stack. The icon is generated by `dev/make-icons.py`.
