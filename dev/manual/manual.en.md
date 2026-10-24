# Show Notes Generator manual

The Show Notes Generator turns a radio show transcript or running order into ready-to-publish show notes with the AI provider of your choice. It is a free web app (PWA) from OnAir Garage. The app itself works offline; writing the show notes needs a connection to the provider you choose.

## Open and install

Open the generator at `https://onairgarage.com/apps/show-notes-ai/` (the tool page is `https://onairgarage.com/tools/show-notes-ai/`). Nothing is installed to use it. You can also install it as an app:

- **Chrome, Edge and other Chromium browsers**: press the *Install app* button.
- **iPhone and iPad (Safari)**: tap the Share button, then "Add to Home Screen".
- **Safari on Mac** (macOS Sonoma or later): File menu, then "Add to Dock".

The app always opens in English; change the language in the header (English, Italiano, Español) and the choice is remembered. The theme can be light, dark or follow the system.

## Setup: provider and key

In **Setup** you choose the **AI provider**:

| Provider | Cost |
|---|---|
| Anthropic (Claude), OpenAI | Paid: each use is billed to your account by the provider |
| Google Gemini, Groq, OpenRouter | A documented free plan or free models are available |
| A local server (Ollama, LM Studio) | On this computer: no key needed, only the server address |

Then choose the **Model** (the suggestions can be edited: model names change often), enter your **API key** (*Show* / *Hide*, *Get a key* opens the provider's page) or, for a local server, the **server address** (this computer only) and the **name of the model on your server**.

**Bring your own key.** The app calls the provider directly from your browser: there is no OnAir Garage server in between. The key is kept in the browser's session storage by default (it is gone when the tab closes) and on the device only if you tick **Remember on this device** (unencrypted, readable by anyone using that browser profile: the app says so). It is sent only to the chosen provider, never logged, never placed in a URL and never written into the saved settings. *Forget this key* removes it.

## Writing the show notes

1. Paste the transcript or the outline of the episode in **Your text**. The counter shows characters, words and an estimate of the tokens; *Clear* empties the box. The text is never saved.
2. In **Options** choose what to **Write** (podcast description, website show notes or social posts), the **Tone** (informative or promotional), the **Length** (short, medium, long) and the **Output language** (same as the text, or another).
3. Press **Write the show notes**. The text appears as it arrives in one piece; **Stop** interrupts it. The request stops by itself after 5 minutes.
4. Edit the text if you like and press **Copy**. The message says "Done. Read it before you publish."

**No API key?** Press **Copy prompt instead**: the app builds the full prompt, which you paste into Claude, ChatGPT or any other assistant.

The instructions tell the model to use only what is in the source, to leave `[placeholders]` for missing facts and to treat the transcript as material, not as commands. The result still has to be read by a person before publishing.

## Language, theme and privacy

Choices (language, theme) are remembered on the device. The transcript is never saved. Errors show the HTTP status only, never the provider's error body (it may echo part of a key). A small tip card has the jar of the site and a link to the tip page of onairgarage.com in your language; nothing is asked inside the generator.

## Updates

The app updates itself: when a new version is ready an "update available" banner offers to reload. Ignoring it just keeps the current version running.

## Limits

- The reply arrives in one piece (no streaming). Long texts on free plans can hit per-minute token limits (HTTP 429 or 413, shown with a clear message). Very long texts are not split: the app only warns.
- The token count is an estimate. Models have different context windows.
- Model names, free plans and prices change: the app points to the provider and states no figures. On Gemini's free plan the content may be used by Google to improve its products (the app shows a warning).
- A local server must allow the page's origin (CORS). Calling `http://localhost` from an https page may be blocked by some browsers; this was not tested in Safari or on iPhone.
- A key remembered on the device can be read by any script running on this origin; the strict policy of the page (no inline code, no third-party scripts) limits that risk but does not remove it.
- This is not a certified tool: it does not validate the quality or accuracy of any model's text.

## Troubleshooting

| Problem | What to do |
|---|---|
| "Paste some text first." | The text box is empty. |
| "Enter your API key in Setup." | Choose the provider and enter the key (not needed for a local server). |
| "The provider rejected the key (error 401/403)." | Check the key in Setup, or get a new one with *Get a key*. |
| "The provider says the account has no credit." | Add credit to your account with the provider, or choose a free provider. |
| "No answer after 5 minutes." | Try a shorter text or another model. |
| HTTP 429 or 413 | The text is too long for a per-minute limit of the provider (common on free plans): shorten it or wait a minute. |
| A local server does not answer | Check that it is running, that it allows the page's origin (CORS) and that the name of the model is right. |

## Contacts

Graziano Melzi · OnAir Garage — `https://onairgarage.com` — `hello@onairgarage.com`. Tool page: `https://onairgarage.com/tools/show-notes-ai/`. Source code and releases: `https://github.com/djgragra/show-notes-ai`. Licence: MIT © 2026 Graziano Melzi.
