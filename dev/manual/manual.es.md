# Manual del Show Notes Generator

El Show Notes Generator convierte la transcripción o la escaleta de un programa de radio en show notes listas para publicar con el proveedor de IA que elijas. Es una aplicación web (PWA) gratuita de OnAir Garage. La app en sí funciona sin conexión; escribir las show notes necesita una conexión con el proveedor que elijas.

## Abrir e instalar

Abre el generador en `https://onairgarage.com/apps/show-notes-ai/` (la página de la herramienta es `https://onairgarage.com/tools/show-notes-ai/`). Para usarlo no se instala nada. También puedes instalarlo como app:

- **Chrome, Edge y otros navegadores Chromium**: pulsa el botón *Instalar app*.
- **iPhone y iPad (Safari)**: toca el botón Compartir y luego «Añadir a pantalla de inicio».
- **Safari en Mac** (macOS Sonoma o posterior): menú Archivo y luego «Añadir al Dock».

La app se abre siempre en inglés; cambia el idioma en la cabecera (English, Italiano, Español) y la elección se recuerda. El tema puede ser claro, oscuro o seguir el sistema.

## Ajustes: proveedor y clave

En **Ajustes** eliges el **Proveedor de IA**:

| Proveedor | Coste |
|---|---|
| Anthropic (Claude), OpenAI | De pago: cada uso lo cobra el proveedor a tu cuenta |
| Google Gemini, Groq, OpenRouter | Hay un plan gratuito documentado o modelos gratuitos |
| Un servidor local (Ollama, LM Studio) | En este ordenador: no hace falta clave, solo la dirección del servidor |

Después eliges el **Modelo** (las sugerencias se pueden editar: los nombres de los modelos cambian a menudo), introduces tu **Clave API** (*Mostrar* / *Ocultar*, *Obtener una clave* abre la página del proveedor) o, para un servidor local, la **dirección del servidor** (solo este ordenador) y el **nombre del modelo en tu servidor**.

**Trae tu propia clave.** La app llama al proveedor directamente desde tu navegador: en medio no hay ningún servidor de OnAir Garage. La clave se guarda por defecto en la memoria de sesión del navegador (desaparece al cerrar la pestaña) y en el dispositivo solo si marcas **Recordar en este dispositivo** (sin cifrar, legible por cualquiera que use ese perfil del navegador: la app lo dice). Se envía solo al proveedor elegido, nunca se registra, nunca se pone en una URL y nunca se escribe en los ajustes guardados. *Olvidar esta clave* la elimina.

## Escribir las show notes

1. Pega la transcripción o la escaleta del episodio en **Tu texto**. El contador muestra caracteres, palabras y una estimación de los tokens; *Borrar* vacía el cuadro. El texto no se guarda nunca.
2. En **Opciones** elige qué **Escribir** (descripción para podcast, show notes para la web o publicaciones sociales), el **Tono** (informativo o promocional), la **Longitud** (corta, media, larga) y el **Idioma del texto** (igual que el texto, u otro).
3. Pulsa **Escribir las show notes**. El texto llega de una sola vez; **Detener** lo interrumpe. La petición se detiene sola tras 5 minutos.
4. Edita el texto si quieres y pulsa **Copiar**. El mensaje dice «Listo. Léelo antes de publicar.»

**¿Sin clave API?** Pulsa **Copiar el prompt**: la app construye el prompt completo, que pegas en Claude, ChatGPT o cualquier otro asistente.

Las instrucciones dicen al modelo que use solo lo que hay en la fuente, que deje `[marcadores]` para los datos que faltan y que trate la transcripción como material, no como órdenes. El resultado debe leerlo igualmente una persona antes de publicar.

## Idioma, tema y privacidad

Las elecciones (idioma, tema) se recuerdan en el dispositivo. La transcripción no se guarda nunca. Los errores muestran solo el estado HTTP, nunca el cuerpo del error del proveedor (podría repetir parte de una clave). Una pequeña tarjeta de propina tiene la hucha del sitio y un enlace a la página de apoyo de onairgarage.com en tu idioma; dentro del generador no se pide nunca nada.

## Actualizaciones

La app se actualiza sola: cuando hay una versión nueva lista, un aviso de «actualización disponible» ofrece recargar. Ignorarlo deja simplemente en marcha la versión actual.

## Límites

- La respuesta llega de una sola vez (sin streaming). Los textos largos en los planes gratuitos pueden topar con los límites de tokens por minuto (HTTP 429 o 413, mostrados con un mensaje claro). Los textos muy largos no se dividen: la app solo avisa.
- El recuento de tokens es una estimación. Los modelos tienen ventanas de contexto distintas.
- Los nombres de los modelos, los planes gratuitos y los precios cambian: la app remite al proveedor y no indica cifras. En el plan gratuito de Gemini el contenido puede ser usado por Google para mejorar sus productos (la app muestra un aviso).
- Un servidor local debe permitir el origen de la página (CORS). Llamar a `http://localhost` desde una página https puede ser bloqueado por algunos navegadores; no se ha probado en Safari ni en iPhone.
- Una clave recordada en el dispositivo puede ser leída por cualquier script que se ejecute en este origen; la política estricta de la página (sin código en línea, sin scripts de terceros) limita ese riesgo pero no lo elimina.
- No es una herramienta certificada: no valida la calidad ni la exactitud del texto de ningún modelo.

## Solución de problemas

| Problema | Qué hacer |
|---|---|
| «Pega primero un texto.» | El cuadro de texto está vacío. |
| «Introduce tu clave API en Ajustes.» | Elige el proveedor e introduce la clave (no hace falta para un servidor local). |
| «El proveedor rechazó la clave (error 401/403).» | Revisa la clave en Ajustes, o consigue una nueva con *Obtener una clave*. |
| «El proveedor indica que la cuenta no tiene crédito.» | Añade crédito a tu cuenta en el proveedor, o elige un proveedor gratuito. |
| «Sin respuesta tras 5 minutos.» | Prueba con un texto más corto u otro modelo. |
| HTTP 429 o 413 | El texto es demasiado largo para un límite por minuto del proveedor (habitual en los planes gratuitos): acórtalo o espera un minuto. |
| Un servidor local no responde | Comprueba que está en marcha, que permite el origen de la página (CORS) y que el nombre del modelo es correcto. |

## Contactos

Graziano Melzi · OnAir Garage — `https://onairgarage.com` — `hello@onairgarage.com`. Página de la herramienta: `https://onairgarage.com/tools/show-notes-ai/`. Código fuente y versiones: `https://github.com/djgragra/show-notes-ai`. Licencia: MIT © 2026 Graziano Melzi.
