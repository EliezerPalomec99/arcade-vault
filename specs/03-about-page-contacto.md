# SPEC 03 — Página "Acerca de" con envío de correo vía Resend

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-09-20
> **Objective:** Construir la ruta `/about` traduciendo `references/templates/home-about/about.jsx` 1:1 al App Router, con el formulario de contacto enviando correos reales vía Resend mediante una Server Action.

## Por qué existe este spec

SPEC 02 dejó explícitamente fuera la página "Acerca de" (`about.jsx`), que incluye hero + misión del proyecto y un formulario de contacto. El formulario del prototipo solo simula el envío (`setSent(form.name)` sin red). Este spec traduce esa pantalla tal cual al App Router y conecta el formulario a un envío de correo real con [Resend](https://resend.com), usando una Server Action de Next.js.

## Scope

**In:**

- Nueva ruta `/about` (`app/about/page.tsx`) traduciendo `references/templates/home-about/about.jsx` sección por sección: hero "Acerca de" (kicker, título, misión, fila de 3 highlights con iconos pixel `HighlightIcon`), banner divisor animado, y sección de contacto (intro + tips + formulario).
- Efecto de scroll-reveal sobre `.reveal` reutilizando el hook `useReveal` creado en SPEC 02 (`hooks/useReveal.ts`).
- Formulario de contacto (nombre, correo, mensaje) con la misma validación del prototipo: si algún campo está vacío al enviar, se aplica la animación `shake` y no se envía nada.
- Campo honeypot oculto adicional (no presente en el prototipo original) para filtrar bots simples: si llega con contenido, la Server Action descarta el envío sin llamar a Resend y responde como éxito silencioso (desde la UI se ve igual que un envío normal, para no delatar el mecanismo al bot).
- Server Action (`"use server"`) que recibe los datos del formulario, valida en servidor (campos no vacíos, formato de correo básico, honeypot vacío) y llama a la API de Resend para enviar el mensaje.
- Paquete `resend` agregado a `package.json` (dependencia de producción).
- Variables de entorno nuevas: `RESEND_API_KEY` y `CONTACT_EMAIL`, documentadas en un `.env.example` nuevo (no versionar valores reales; `.env.local` queda en `.gitignore`, que ya ignora `.env*` por el scaffold de create-next-app).
- Estado de envío en el formulario: mientras la Server Action está en curso, el botón "ENVIAR MENSAJE" queda deshabilitado y su texto cambia a "ENVIANDO…".
- Estado de éxito: idéntico al del prototipo (bloque `terminal-success` con las líneas de log falsas y el mensaje final), mostrado solo después de que la Server Action confirma el envío real.
- Estado de error: si Resend falla (API key inválida, red, rate limit) o la validación de servidor rechaza los datos, se muestra un mensaje de error inline pixel-art debajo del formulario, sin perder lo que el usuario escribió, permitiendo reintentar.
- Actualización de `components/Nav.tsx`: nuevo link "Acerca de" → `/about` en el listado de desktop y en el panel móvil, con su propia lógica `isActive` (`pathname === "/about"`).
- Migración a `app/globals.css` de las clases CSS de la sección `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` (`.about`, `.about-hero`, `.about-mission`, `.highlight-row`/`.highlight`, `.hl-icon`, `.about-divider`/`.div-bar`/`.div-pixels`, `.about-contact`/`.contact-grid`/`.contact-intro`/`.contact-title`/`.contact-sub`/`.contact-tips`/`.tip`/`.tip-led`, `.contact-form`, `.terminal-success`/`.term-bar`/`.term-body`/`.line`/`.caret`, y la variante `.shake`), sin alterar clases ya migradas en specs anteriores.
- Diseño responsive (mobile/desktop) para la página, igual que el resto de pantallas del proyecto.

**Out of scope (para specs futuras):**

- Cualquier backend de almacenamiento de mensajes de contacto (base de datos, CRM, ticketing). El mensaje solo se envía por correo vía Resend; no se persiste en ningún lado del proyecto.
- Rate limiting propio a nivel de servidor más allá de lo que Resend aplique de fondo (no se implementa un limitador de envíos por IP/usuario en este spec).
- Verificación de dominio propio en Resend. Se usa el dominio de pruebas `onboarding@resend.dev` como remitente; migrar a un dominio verificado (ej. `contacto@arcadevault.com`) es una tarea de infraestructura fuera de alcance de este spec.
- Notificación de confirmación por correo al usuario que llena el formulario (auto-respuesta). Solo se envía un correo, al destinatario de contacto.
- Captcha o protección anti-bot más avanzada que el honeypot (reCAPTCHA, Turnstile, etc.).
- Cambiar el copy o rediseñar visualmente el About más allá de lo que ya define el prototipo; cualquier ajuste de diseño nuevo se evalúa con `/frontend-design` durante la implementación.

## Data model

No se introduce ningún tipo de dominio persistente (no hay base de datos ni `lib/*.ts` de datos nuevos). Sí se define la forma de los datos que viajan entre el formulario y la Server Action:

```ts
// tipo interno usado por el formulario y la Server Action (ej. en app/about/contact-action.ts)
type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

// payload recibido por la Server Action (vía FormData)
// name: string, email: string, msg: string, honeypot: string (campo oculto, debe llegar vacío)
```

```bash
# .env.example
RESEND_API_KEY=
CONTACT_EMAIL=eliezer.palomec.dev@gmail.com
```

Convenciones:

- `RESEND_API_KEY` y `CONTACT_EMAIL` se leen solo en la Server Action (código de servidor), nunca se exponen al cliente (no llevan prefijo `NEXT_PUBLIC_`).
- El remitente ("from") queda fijo en el código como `Arcade Vault <onboarding@resend.dev>`, no es configurable por variable de entorno en este spec.
- El honeypot se envía como un input de texto oculto (visualmente, no `type="hidden"`, para desalentar autocompletado de bots) con `name` distinto a los campos reales; si llega no-vacío, la Server Action responde `{ status: "success" }` sin invocar a Resend.

## Implementation plan

1. Agregar la dependencia `resend` a `package.json` (`npm install resend`) y crear `.env.example` con `RESEND_API_KEY` y `CONTACT_EMAIL` (valor de ejemplo `eliezer.palomec.dev@gmail.com`). Sistema funcional: el proyecto instala y sigue compilando igual que antes, sin uso todavía del paquete.
2. Migrar a `app/globals.css` las clases de la sección `ABOUT PAGE` de `references/templates/home-about/styles.css` listadas en el scope, comparando visualmente contra el prototipo. Sistema funcional: las clases existen y compilan, aunque todavía no se usen.
3. Crear la Server Action de envío (ej. `app/about/contact-action.ts`, `"use server"`): recibe `FormData`, valida `name`/`email`/`msg` no vacíos y `email` con formato básico válido, revisa que el honeypot venga vacío, y si todo pasa llama a `resend.emails.send(...)` con `from: "Arcade Vault <onboarding@resend.dev>"`, `to: process.env.CONTACT_EMAIL`, asunto y cuerpo con los datos del formulario. Devuelve `ContactFormState`. Si el honeypot viene lleno, devuelve `{ status: "success" }` sin llamar a Resend. Si Resend lanza error o falta `RESEND_API_KEY`, devuelve `{ status: "error", message: "..." }`. Sistema funcional: la acción existe y es invocable, sin UI todavía conectada.
4. Crear el componente de formulario cliente (ej. `components/about/ContactForm.tsx`, `"use client"`) traduciendo el formulario de `about.jsx`: mismos campos y validación de vacíos con `shake`, campo honeypot oculto adicional, estado de envío (botón deshabilitado + "ENVIANDO…" mientras la Server Action está en curso, usando `useTransition` o el estado de pendiente del formulario), y ramifica en tres vistas: formulario, éxito (`terminal-success` idéntico al prototipo) y error (mensaje inline pixel-art, formulario visible y datos intactos para reintentar). Invoca la Server Action del paso 3. Sistema funcional: se puede enviar el formulario y ver los tres estados (llenándolo con datos reales, vacíos, o forzando un error quitando `RESEND_API_KEY`).
5. Crear `app/about/page.tsx` traduciendo el resto de `about.jsx`: hero (kicker, título, misión, `highlight-row` con `HighlightIcon`), banner divisor animado, sección de contacto (intro + `contact-tips`) usando el `ContactForm` del paso 4, y el hook `useReveal` de SPEC 02 sobre los elementos `.reveal`. Sistema funcional: `/about` carga completa y navegable.
6. Actualizar `components/Nav.tsx`: agregar link "Acerca de" → `/about` (activo solo en `pathname === "/about"`) en el listado de desktop y en el panel móvil. Sistema funcional: la página es alcanzable desde el nav en desktop y móvil.
7. Revisión final: verificar en `npm run dev` que `/about` carga sin errores de consola, que el formulario envía un correo real a `CONTACT_EMAIL` vía Resend (con una API key de prueba), que los tres estados (éxito, error, validación de vacíos) se ven correctamente, y que el responsive (<840px) funciona igual que el resto de pantallas.

## Acceptance criteria

- [ ] La ruta `/about` carga sin errores en consola y muestra el hero, los 3 highlights, el banner divisor y la sección de contacto.
- [ ] Enviar el formulario con algún campo vacío activa la animación `shake` y no invoca la Server Action.
- [ ] Enviar el formulario con datos válidos deshabilita el botón y muestra "ENVIANDO…" mientras la Server Action está en curso.
- [ ] Un envío exitoso muestra el bloque `terminal-success` con el nombre del usuario, y ese correo llega realmente a la dirección de `CONTACT_EMAIL` vía Resend.
- [ ] Si `RESEND_API_KEY` falta o es inválida, el envío muestra el mensaje de error inline y conserva lo escrito en el formulario, permitiendo reintentar sin perder datos.
- [ ] Rellenar el campo honeypot oculto y enviar el formulario no genera ningún correo en Resend, pero la UI muestra el mismo estado de éxito que un envío real.
- [ ] El nav muestra "Acerca de" activo solo en `/about`, en desktop y en el panel móvil.
- [ ] Las secciones `.reveal` de `/about` aparecen con la animación de entrada al hacer scroll (se agrega `.in` al entrar en viewport).
- [ ] En viewport menor a 840px, `/about` es legible y el panel lateral del nav sigue abriendo/cerrando correctamente.
- [ ] `npm run build` completa sin errores de tipo ni de lint.

## Decisions

- **Sí:** ruta `/about` (en inglés) en vez de `/acerca-de`. Razón: decisión explícita del usuario; consistente con `/games` (SPEC 02), que también usa inglés pese a que el resto de rutas del proyecto está en español.
- **Sí:** envío real vía Resend con Server Action, no Route Handler. Razón: decisión explícita del usuario; encaja mejor con formularios de App Router sin necesidad de un endpoint HTTP adicional ni fetch manual desde el cliente.
- **Sí:** agregar el link "Acerca de" a `components/Nav.tsx` en este spec, revirtiendo la exclusión explícita de SPEC 02. Razón: decisión explícita del usuario; sin el link, la página quedaría inalcanzable desde la UI.
- **Sí:** usar el dominio de pruebas `onboarding@resend.dev` como remitente en vez de un dominio propio verificado. Razón: decisión explícita del usuario; no hay dominio verificado en Resend todavía y bloquearía la implementación.
- **Sí:** destinatario configurable vía `CONTACT_EMAIL` en variable de entorno (valor inicial `eliezer.palomec.dev@gmail.com`), en vez de hardcodear la dirección en el código. Razón: mantiene la dirección de contacto fuera del código fuente y fácil de rotar sin un despliegue de cambio de código.
- **Sí:** agregar un honeypot simple como única protección anti-spam. Razón: decisión explícita del usuario; es barato de implementar y filtra bots simples sin fricción para usuarios reales. Captcha completo queda fuera de alcance.
- **Sí:** en caso de error de Resend o validación de servidor, mostrar mensaje inline sin perder los datos del formulario. Razón: decisión explícita del usuario; consistente con la UX retro del resto del proyecto y evita que el usuario pierda su mensaje si falla el envío.
- **No:** persistir los mensajes de contacto en algún storage (localStorage, base de datos). Razón: el formulario es de envío por correo únicamente; agregar persistencia es una extensión de producto que amerita su propio spec.
- **No:** auto-respuesta de confirmación al usuario que llena el formulario. Razón: no fue pedido y agrega una plantilla de correo adicional fuera del alcance mínimo de "que el correo llegue".

## Identified risks

- Si `RESEND_API_KEY` no está configurada en el entorno de desarrollo/producción, todo envío fallará. Mitigación: `.env.example` documenta la variable requerida y el estado de error de la UI lo comunica claramente en vez de fallar en silencio.
- El dominio de pruebas `onboarding@resend.dev` de Resend puede tener límites de envío o de destinatarios permitidos (verificar en la cuenta del usuario) más restrictivos que un dominio propio verificado. Mitigación: documentado como decisión explícita en este spec; migrar a dominio propio es un cambio de configuración futuro, no de código.
- El honeypot es una protección básica y no detiene bots sofisticados que sí completan formularios ocultos. Mitigación: aceptado explícitamente como decisión de alcance; suficiente para el riesgo actual (proyecto sin tráfico significativo todavía).
