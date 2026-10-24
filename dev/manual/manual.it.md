# Manuale dello Show Notes Generator

Lo Show Notes Generator trasforma la trascrizione o la scaletta di una trasmissione radiofonica in show notes pronte da pubblicare con il provider AI che scegli. È una web app (PWA) gratuita di OnAir Garage. L'app in sé funziona offline; scrivere le show notes richiede una connessione al provider che scegli.

## Aprire e installare

Apri il generatore su `https://onairgarage.com/apps/show-notes-ai/` (la pagina dello strumento è `https://onairgarage.com/tools/show-notes-ai/`). Per usarlo non si installa nulla. Puoi anche installarlo come app:

- **Chrome, Edge e altri browser Chromium**: premi il pulsante *Installa app*.
- **iPhone e iPad (Safari)**: tocca il pulsante Condividi, poi «Aggiungi alla schermata Home».
- **Safari su Mac** (macOS Sonoma o successivo): menu File, poi «Aggiungi al Dock».

L'app si apre sempre in inglese; cambia lingua nell'intestazione (English, Italiano, Español) e la scelta viene ricordata. Il tema può essere chiaro, scuro o seguire il sistema.

## Impostazioni: provider e chiave

In **Impostazioni** scegli il **Provider AI**:

| Provider | Costo |
|---|---|
| Anthropic (Claude), OpenAI | A pagamento: ogni uso è addebitato sul tuo account dal provider |
| Google Gemini, Groq, OpenRouter | È disponibile un piano gratuito documentato o modelli gratuiti |
| Un server locale (Ollama, LM Studio) | Su questo computer: non serve nessuna chiave, solo l'indirizzo del server |

Poi scegli il **Modello** (i suggerimenti si possono modificare: i nomi dei modelli cambiano spesso), inserisci la tua **Chiave API** (*Mostra* / *Nascondi*, *Ottieni una chiave* apre la pagina del provider) oppure, per un server locale, l'**indirizzo del server** (solo questo computer) e il **nome del modello sul tuo server**.

**Porta la tua chiave.** L'app chiama il provider direttamente dal tuo browser: in mezzo non c'è nessun server di OnAir Garage. La chiave è tenuta per default nella memoria di sessione del browser (sparisce quando la scheda si chiude) e sul dispositivo solo se spunti **Ricorda su questo dispositivo** (non cifrata, leggibile da chiunque usi quel profilo del browser: l'app lo dice). Viene inviata solo al provider scelto, mai registrata, mai messa in un URL e mai scritta nelle impostazioni salvate. *Dimentica questa chiave* la rimuove.

## Scrivere le show notes

1. Incolla la trascrizione o la scaletta della puntata in **Il tuo testo**. Il contatore mostra caratteri, parole e una stima dei token; *Svuota* svuota la casella. Il testo non viene mai salvato.
2. In **Opzioni** scegli cosa **Scrivere** (descrizione per podcast, show notes per il sito o post social), il **Tono** (informativo o promozionale), la **Lunghezza** (breve, media, lunga) e la **Lingua del testo** (come il testo, o un'altra).
3. Premi **Scrivi le show notes**. Il testo arriva in un colpo solo; **Ferma** lo interrompe. La richiesta si ferma da sola dopo 5 minuti.
4. Modifica il testo se vuoi e premi **Copia**. Il messaggio dice «Fatto. Rileggi prima di pubblicare.»

**Nessuna chiave API?** Premi **Copia il prompt**: l'app costruisce il prompt completo, che incolli in Claude, ChatGPT o qualsiasi altro assistente.

Le istruzioni dicono al modello di usare solo ciò che c'è nella fonte, di lasciare dei `[segnaposto]` per i fatti mancanti e di trattare la trascrizione come materiale, non come comandi. Il risultato deve comunque essere letto da una persona prima di pubblicare.

## Lingua, tema e privacy

Le scelte (lingua, tema) vengono ricordate sul dispositivo. La trascrizione non viene mai salvata. Gli errori mostrano solo lo stato HTTP, mai il corpo dell'errore del provider (potrebbe riportare parte di una chiave). Un piccolo riquadro mancia ha il salvadanaio del sito e un link alla pagina di sostegno di onairgarage.com nella tua lingua; dentro il generatore non viene mai chiesto nulla.

## Aggiornamenti

L'app si aggiorna da sola: quando una nuova versione è pronta, un avviso «aggiornamento disponibile» offre di ricaricare. Ignorarlo lascia semplicemente in funzione la versione attuale.

## Limiti

- La risposta arriva in un colpo solo (niente streaming). I testi lunghi sui piani gratuiti possono incontrare i limiti di token al minuto (HTTP 429 o 413, mostrati con un messaggio chiaro). I testi molto lunghi non vengono divisi: l'app si limita ad avvisare.
- Il conteggio dei token è una stima. I modelli hanno finestre di contesto diverse.
- I nomi dei modelli, i piani gratuiti e i prezzi cambiano: l'app rimanda al provider e non indica cifre. Sul piano gratuito di Gemini il contenuto può essere usato da Google per migliorare i suoi prodotti (l'app mostra un avviso).
- Un server locale deve consentire l'origine della pagina (CORS). Chiamare `http://localhost` da una pagina https può essere bloccato da alcuni browser; non è stato provato in Safari né su iPhone.
- Una chiave ricordata sul dispositivo può essere letta da qualsiasi script che giri su questa origine; la politica rigida della pagina (niente codice inline, niente script di terzi) limita il rischio ma non lo elimina.
- Non è uno strumento certificato: non valida la qualità né l'accuratezza del testo di nessun modello.

## Risoluzione dei problemi

| Problema | Cosa fare |
|---|---|
| «Incolla prima un testo.» | La casella del testo è vuota. |
| «Inserisci la chiave API in Impostazioni.» | Scegli il provider e inserisci la chiave (non serve per un server locale). |
| «Il provider ha rifiutato la chiave (errore 401/403).» | Controlla la chiave in Impostazioni, o ottienine una nuova con *Ottieni una chiave*. |
| «Il provider dice che l'account non ha credito.» | Aggiungi credito al tuo account presso il provider, oppure scegli un provider gratuito. |
| «Nessuna risposta dopo 5 minuti.» | Prova un testo più corto o un altro modello. |
| HTTP 429 o 413 | Il testo è troppo lungo per un limite al minuto del provider (frequente sui piani gratuiti): accorcialo o aspetta un minuto. |
| Un server locale non risponde | Controlla che sia in funzione, che consenta l'origine della pagina (CORS) e che il nome del modello sia giusto. |

## Contatti

Graziano Melzi · OnAir Garage — `https://onairgarage.com` — `hello@onairgarage.com`. Pagina dello strumento: `https://onairgarage.com/tools/show-notes-ai/`. Codice sorgente e release: `https://github.com/djgragra/show-notes-ai`. Licenza: MIT © 2026 Graziano Melzi.
