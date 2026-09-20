# SPEC 01 — MVP visual de las 5 pantallas de Arcade Vault

> **Status:** Implementado
> **Depends on:** ninguna
> **Date:** 2026-09-18
> **Objective:** Construir la capa visual de las 5 pantallas del prototipo (`references/templates/`) como páginas reales de Next.js App Router, sin implementar ningún juego jugable de verdad.

## Por qué existe este spec

El repo ya tiene el scaffold de Next.js 16 y el sistema de diseño base migrado a `app/globals.css` (tokens de color, fondo con grid/scanlines, ruido, fuentes vía `next/font/google` en `app/layout.tsx`). Lo que falta es todo lo demás: rutas, componentes, datos mock y la interacción de UI que el prototipo HTML/JSX en `references/templates/` ya define. Este spec traduce ese prototipo (hash-routing, React 18 UMD sin build) a convenciones reales de App Router, sin inventar mecánica de juego.

## Scope

**In:**

- 5 rutas reales bajo `app/`, una por vista del prototipo:
  - `/` — Biblioteca (`biblioteca.jsx`): hero, buscador, chips de categoría, grid de tarjetas de juego.
  - `/juegos/[id]` — Detalle (`detalle.jsx`): portada, tags, descripción, stats, tabla de mejores puntuaciones, botones de acción.
  - `/juegos/[id]/jugar` — Reproductor (`reproductor.jsx`): HUD, frame CRT, simulación visual de partida, modal de fin de partida.
  - `/iniciar-sesion` — Auth (`auth.jsx`): tabs iniciar sesión / crear cuenta, formulario, botón invitado, botones sociales decorativos.
  - `/salon-de-la-fama` — Salón de la Fama (`salon.jsx`): tabs por juego, podio top 3, tabla de ranking, fila "tu marca" si hay sesión.
- Barra de navegación (`nav.jsx`) en `app/layout.tsx`, con estado activo por ruta, contador de créditos decorativo, botón de sesión, y menú hamburguesa/panel lateral para móvil.
- Datos mock de juegos y jugadores traducidos a un módulo TypeScript (`lib/games.ts`), incluyendo la función `seededScores` para generar rankings deterministas.
- Simulación visual del reproductor: puntaje que sube solo por intervalo, niveles, vidas, pausa/reanudar, botón "FIN", modal de resultado con input de iniciales y botón "GUARDAR PUNTUACIÓN".
- Persistencia real en `localStorage` equivalente a la del prototipo:
  - `av_user`: sesión simulada (`{ name: string } | null`), escrita por login/crear cuenta/invitado, borrada por cerrar sesión.
  - `av_scores`: lista de partidas guardadas (`{ game, score, name, at }`), a la que el reproductor hace `push` al guardar.
- Diseño responsive (mobile/desktop) reutilizando las clases ya presentes en `app/globals.css` (`.av-nav`, `.card`, `.btn`, `.crt`, `.modal`, `.hall-table`, etc.).
- Texto de interfaz en español, igual al del prototipo.

**Out of scope (para specs futuras):**

- Cualquier lógica de juego real (colisiones, input del jugador, reglas, dificultad real). El "juego" del reproductor sigue siendo una animación decorativa con puntaje aleatorio, igual que en `reproductor.jsx`.
- Autenticación real (backend, hashing de contraseñas, OAuth de Google/GitHub). Los botones sociales quedan decorativos y sin `onClick` funcional, igual que en el prototipo.
- Persistencia de puntuaciones en un backend/base de datos. Todo vive en `localStorage` del navegador.
- Buscador o filtros con backend (la búsqueda/categoría del `/` sigue siendo un filtro en memoria sobre el array mock, como en `biblioteca.jsx`).
- Internacionalización / soporte multi-idioma.
- Tests automatizados (no hay test runner configurado en el repo).
- Créditos jugables (el contador "CRÉDITOS · 03" del nav sigue siendo un valor fijo, no un sistema de monedas).

## Data model

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS "cover-*" ya definida en globals.css
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string; // ej. "12.4K", texto ya formateado
};

export const GAMES: Game[]; // los 8 juegos mock de data.jsx, sin cambios de contenido
export const CATEGORIES: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export type ScoreRow = { rank: number; name: string; score: number; date: string };
export function seededScores(seed: number, count?: number): ScoreRow[]; // misma función determinista de data.jsx
```

```ts
// lib/session.ts — helpers de localStorage, sin backend
export type Session = { name: string } | null;

export const AV_USER_KEY = "av_user";
export const AV_SCORES_KEY = "av_scores";

export type SavedScore = { game: string; score: number; name: string; at: number };

export function getSession(): Session;
export function setSession(session: Session): void;
export function clearSession(): void;

export function appendScore(entry: Omit<SavedScore, "at">): void;
```

Convenciones:

- IDs de juego: kebab-case, iguales a los del prototipo (`bloque-buster`, `caida`, etc.) — se usan como segmento de ruta dinámica `[id]`.
- Todo acceso a `localStorage` va envuelto en `try/catch` (como en el prototipo), porque puede no estar disponible (modo privado) o el JSON puede estar corrupto.
- Las claves `av_user` y `av_scores` no llevan versionado de esquema; si el formato cambia en el futuro, se resuelve reescribiendo la clave (fuera de scope de este spec).

## Implementation plan

1. Crear `lib/games.ts` con `GAMES`, `CATEGORIES` y `seededScores`, traduciendo `references/templates/data.jsx` 1:1 a TypeScript tipado. Sistema funcional: el módulo compila y se puede importar.
2. Crear `lib/session.ts` con los helpers de `localStorage` descritos arriba. Sistema funcional: helpers exportados, sin uso todavía.
3. Crear `components/Nav.tsx` (client component) traduciendo `nav.jsx`: logo, links activos por ruta con `usePathname`, contador de créditos fijo, botón de sesión (lee `getSession()`), botón hamburguesa y panel lateral móvil con las clases `.av-mobile-panel`/`.av-mobile-backdrop` ya existentes en `globals.css`. Wire en `app/layout.tsx` justo antes de `{children}`, dejando el footer actual del layout intacto. Sistema funcional: la nav se ve en todas las páginas aunque las rutas de abajo aún no existan.
4. Implementar `/` (`app/page.tsx`) traduciendo `biblioteca.jsx`: hero, buscador con estado, chips de categoría, grid de `GameCard` filtrando `GAMES` en memoria, estado vacío "NO HAY RESULTADOS". Cada tarjeta enlaza a `/juegos/[id]` con `<Link>`. Sistema funcional: se puede navegar, buscar y filtrar en la biblioteca.
5. Implementar `/juegos/[id]/page.tsx` traduciendo `detalle.jsx`: portada, tags fijos, descripción, stat-strip, tabla de mejores puntuaciones vía `seededScores`, botones "JUGAR AHORA" (a `/juegos/[id]/jugar`) y "VOLVER AL VAULT". Si el `id` no existe en `GAMES`, usar `notFound()` de Next.js. Sistema funcional: cada tarjeta de la biblioteca lleva a un detalle real.
6. Implementar `/juegos/[id]/jugar/page.tsx` (client component) traduciendo `reproductor.jsx`: HUD con jugador/puntuación/vidas/nivel, intervalo que incrementa el puntaje mientras no esté pausado ni terminado, subida de nivel cada 2500 puntos, botones pausa/fin/salir, frame CRT decorativo con las clases `.crt`/`.game-arena` existentes, modal de fin de partida con input de iniciales (prellenado con la sesión activa o "INVITADO") y botón "GUARDAR PUNTUACIÓN" que llama a `appendScore`. Sistema funcional: se puede "jugar", pausar, terminar y guardar una puntuación falsa.
7. Implementar `/iniciar-sesion/page.tsx` (client component) traduciendo `auth.jsx`: tabs iniciar sesión / crear cuenta, formulario controlado, botón "JUGAR COMO INVITADO" (crea sesión `null`... realmente limpia sesión y navega, igual que el prototipo), botones sociales decorativos sin acción, y al enviar el formulario llama a `setSession({ name })` y redirige a `/`. Sistema funcional: se puede "iniciar sesión" y el nav refleja el nombre de usuario.
8. Implementar `/salon-de-la-fama/page.tsx` traduciendo `salon.jsx`: tabs por juego (uno por cada `Game`), podio top 3, tabla de ranking vía `seededScores`, fila "tu mejor marca" solo si hay sesión activa (mismo cálculo simulado `rows[5]?.score - 2400` que el prototipo). Sistema funcional: las 5 pantallas quedan enlazadas entre sí desde el nav y los botones internos.
9. Revisión final de responsive: verificar en ancho móvil (<840px) que el nav colapsa a hamburguesa y el panel lateral funciona en las 5 rutas; ajustar cualquier clase faltante en `app/globals.css` si algo del prototipo no se copió (comparar contra `references/templates/styles.css`).

## Acceptance criteria

- [ ] Las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/iniciar-sesion` y `/salon-de-la-fama` cargan sin errores en consola con `npm run dev`.
- [ ] Desde `/` se puede buscar por texto y filtrar por categoría, y el grid se actualiza sin recargar la página.
- [ ] Al hacer clic en una tarjeta de `/` se navega a `/juegos/<id-del-juego>` con los datos correctos de ese juego.
- [ ] En `/juegos/[id]` el botón "JUGAR AHORA" navega a `/juegos/[id]/jugar`.
- [ ] Visitar `/juegos/id-inexistente` muestra la página 404 de Next.js.
- [ ] En `/juegos/[id]/jugar` el puntaje sube automáticamente mientras no está en pausa; "PAUSA" detiene el incremento y "REANUDAR" lo reactiva.
- [ ] Pulsar "FIN" en el reproductor abre el modal de fin de partida con el puntaje final mostrado.
- [ ] Escribir iniciales y pulsar "GUARDAR PUNTUACIÓN" agrega una entrada a `localStorage["av_scores"]` y reemplaza el formulario por el mensaje de confirmación.
- [ ] Enviar el formulario de `/iniciar-sesion` (con cualquier usuario) guarda `localStorage["av_user"]`, redirige a `/` y el nav muestra el nombre de usuario en mayúsculas.
- [ ] Pulsar "JUGAR COMO INVITADO" limpia cualquier sesión previa y redirige a `/`.
- [ ] Cerrar sesión desde el nav borra `localStorage["av_user"]` y el botón vuelve a mostrar "Iniciar Sesión".
- [ ] En `/salon-de-la-fama`, cambiar de tab cambia el podio y la tabla al juego seleccionado.
- [ ] Con sesión activa, `/salon-de-la-fama` muestra la fila "TU MEJOR MARCA"; sin sesión, esa fila no aparece.
- [ ] En viewport menor a 840px, el nav muestra el botón hamburguesa y el panel lateral se abre/cierra correctamente en las 5 rutas.
- [ ] `npm run build` completa sin errores de tipo ni de lint.

## Decisions

- **Sí:** rutas descriptivas en español (`/juegos/[id]`, `/iniciar-sesion`, `/salon-de-la-fama`) en vez de traducir a inglés. Razón: coherencia con el copy en español de toda la interfaz.
- **No:** rutas en inglés. Habría mezclado idioma de URLs con idioma de UI sin necesidad.
- **Sí:** simulación visual completa del reproductor (score autoincremental, pausa, modal de fin) en vez de un placeholder estático. Razón: es parte explícita del alcance pedido ("todas las pantallas") y el prototipo ya define ese comportamiento como puramente decorativo, no como un juego real.
- **Sí:** persistencia real en `localStorage` para sesión y puntuaciones, replicando `av_user`/`av_scores` del prototipo. Razón: sin esto, el flujo "iniciar sesión → jugar → guardar puntuación → verla en el salón" no se puede demostrar ni probar manualmente.
- **No:** backend/API para sesión o puntuaciones. Fuera de alcance de un MVP "solo visual"; se define en un spec futuro si el proyecto lo necesita.
- **Sí:** datos mock en un módulo TypeScript (`lib/games.ts`) en vez de JSON. Razón: permite tipar `Game`/`ScoreRow` y mantener `seededScores` como función, tal como en el prototipo, sin una capa de fetch innecesaria para datos estáticos.
- **Sí:** incluir el menú móvil/hamburguesa desde este spec. Razón: el proyecto ya se define como responsive (Tailwind) y el prototipo lo implementa completo; dejarlo fuera generaría una regresión visible en móvil.
- **Sí:** un solo spec para las 5 pantallas. Razón: comparten el mismo sistema de diseño (ya migrado a `globals.css`) y los mismos datos mock; dividirlo habría fragmentado el contexto sin beneficio real para este MVP.
- **No:** reescribir o rediseñar el sistema visual. El spec reutiliza las clases CSS ya migradas en `app/globals.css`; cualquier ajuste de diseño nuevo se evalúa con el skill `/frontend-design` durante la implementación, no aquí.

## What is **not** in this spec

- Juegos jugables de verdad (cualquier mecánica, input o física real).
- Autenticación real con backend, hashing o proveedores OAuth funcionales.
- Persistencia de puntuaciones fuera de `localStorage` (backend, base de datos, sync entre dispositivos).
- Sistema de créditos/monedas funcional.
- Tests automatizados.
- Internacionalización.

Cada uno de estos, si se implementa, va en su propio spec.
