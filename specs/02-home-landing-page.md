# SPEC 02 — Home (landing) y reubicación de rutas a `/games`

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-09-20
> **Objective:** Construir la pantalla Home (landing) en `/` traduciendo `references/templates/home-about/home.jsx` a App Router, reubicando la Biblioteca actual (hoy en `/`) a `/games` y las rutas de detalle/reproductor a `/games/[id]` y `/games/[id]/jugar`.

## Por qué existe este spec

SPEC 01 implementó `/` como la Biblioteca (grid de juegos con buscador y filtros), sin una landing propia. El prototipo (`references/templates/home-about/`) sí separa "Inicio" (landing con hero, secciones de valor, preview de juegos, stats, actividad en vivo y precios) de "Biblioteca" como pantallas distintas, tal como refleja `nav.jsx` del prototipo. Este spec cierra esa brecha: mueve la Biblioteca a `/games` (junto con sus rutas hijas de detalle y reproductor, hoy en español bajo `/juegos`) y construye la nueva Home en `/`, dejando todo el árbol de rutas del juego bajo un único prefijo `/games`.

## Scope

**In:**

- Nueva ruta `/` (`app/page.tsx`) traduciendo `references/templates/home-about/home.jsx`: hero con silhouettes flotantes decorativas, sección "¿Por qué Arcade Vault?" (feature grid de 4 tarjetas con iconos pixel), preview de juegos (6 `MiniCard` desde `GAMES`), sección de stats, sección "Actividad en vivo" (últimas puntuaciones + top jugadores, con datos mock estáticos idénticos al prototipo), sección de precios (plan único gratis + FAQ), y CTA final.
- Efecto de scroll-reveal (`IntersectionObserver` sobre elementos `.reveal`) como hook reutilizable, traduciendo `useReveal` de `home.jsx`.
- Reubicación de la Biblioteca actual: contenido de `app/page.tsx` (hero corto, buscador, chips de categoría, grid `GameCard`) se mueve a `app/games/page.tsx`.
- Reubicación de las rutas de detalle y reproductor: `app/juegos/[id]/page.tsx` → `app/games/[id]/page.tsx`; `app/juegos/[id]/jugar/page.tsx` → `app/games/[id]/jugar/page.tsx`, incluyendo la actualización de los `PageProps`/tipos de ruta generados por Next y de los links internos (`/juegos/...` → `/games/...`) dentro de esas páginas.
- Actualización de `components/GameCard.tsx` para enlazar a `/games/${game.id}` en vez de `/juegos/${game.id}`.
- Actualización de `components/Nav.tsx`: nuevo link "Inicio" apuntando a `/`, link "Biblioteca" reapuntado a `/games`, y lógica `isActive` ajustada (Home activo solo en `/`; Biblioteca activo en `/games` y `/games/*`).
- Botones/CTAs de la Home enlazan a rutas reales: "Explorar juegos" y "Ver todos los juegos" y "Insertar moneda" (CTA final) → `/games`; tarjetas de preview de juego → `/games/[id]`; "Crear cuenta" y CTA de precios → `/iniciar-sesion`; link "Ver salón" de la sección de actividad → `/salon-de-la-fama`.
- Migración a `app/globals.css` de las clases CSS necesarias para la Home que hoy solo existen en `references/templates/home-about/styles.css` (`.home-hero`, `.home-silos`/`.silo`, `.home-title`, `.home-sub`, `.home-ctas`, `.hero-scroll`, `.home-section`, `.section-head`, `.feature-grid`/`.feature-card`, `.ft-icon`, `.mini-rail`/`.mini-card`, `.home-stats`/`.stat-block`, `.activity-grid`/`.activity-card`/`.ticker`/`.tick-row`/`.top-list`/`.top-row`, `.pricing-grid`/`.price-card`/`.pricing-faq`, `.home-final`, `.reveal`/`.in`), sin alterar clases ya migradas en SPEC 01.
- Diseño responsive (mobile/desktop) para todas las secciones nuevas de la Home, igual que el resto de pantallas.

**Out of scope (para specs futuras):**

- Página "Acerca de" (`about.jsx`, hero + formulario de contacto) y su link de nav correspondiente. No se agrega a `components/Nav.tsx` en este spec.
- Conectar la sección "Actividad en vivo" a datos reales (`localStorage['av_scores']`, `seededScores`). Se mantiene como mock estático de solo lectura, idéntico a los arrays hardcodeados de `home.jsx` (jugadores/puntuaciones ficticias).
- Cualquier cambio a la lógica interna de las páginas de detalle/reproductor/biblioteca más allá de actualizar sus rutas y links (buscador, filtros, HUD, guardado de puntuación, etc. quedan igual que en SPEC 01).
- Redirecciones desde las URLs viejas `/juegos/[id]` y `/juegos/[id]/jugar` hacia `/games/...` (no hay usuarios en producción todavía; no se define compatibilidad retroactiva de URLs).
- SEO/metadata específico de la Home más allá del `metadata` global ya definido en `app/layout.tsx`.

## Data model

No se introduce ningún dato ni tipo nuevo. La Home reutiliza `GAMES` de `lib/games.ts` (mismo módulo de SPEC 01) para el preview de juegos, y define los datos de "Actividad en vivo" y "Top jugadores · hoy" como arrays constantes locales al componente (mock decorativo, igual que en `home.jsx`), sin persistirlos ni tipificarlos en `lib/`.

## Implementation plan

1. Mover las rutas de juego a `/games`: `git mv app/juegos/[id] app/games/[id]` (arrastra `page.tsx` y `jugar/page.tsx`). Actualizar en `app/games/[id]/page.tsx` el tipo `PageProps<"/juegos/[id]">` → `PageProps<"/games/[id]">` y el link interno `/juegos/${game.id}/jugar` → `/games/${game.id}/jugar`. Actualizar en `app/games/[id]/jugar/page.tsx` el link `/juegos/${game.id}` → `/games/${game.id}`. Sistema funcional: `/games/<id>` y `/games/<id>/jugar` cargan igual que antes bajo la nueva ruta.
2. Crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (hero corto, buscador, chips, grid `GameCard`, estado vacío), sin cambios de comportamiento. Sistema funcional: `/games` muestra la Biblioteca exactamente como se veía antes en `/`.
3. Actualizar `components/GameCard.tsx`: `href` de `/juegos/${game.id}` a `/games/${game.id}`. Sistema funcional: las tarjetas de `/games` enlazan correctamente al detalle.
4. Migrar a `app/globals.css` las clases CSS de Home listadas en el scope, traduciendo `references/templates/home-about/styles.css` (comparar visualmente contra el prototipo). Sistema funcional: las clases existen y compilan, aunque todavía no se usen.
5. Crear el hook de scroll-reveal (`hooks/useReveal.ts` o equivalente) traduciendo el `useReveal` de `home.jsx` (observa `.reveal`, agrega `.in` al entrar en viewport, `threshold: 0.12`). Sistema funcional: hook exportado, sin uso todavía.
6. Reescribir `app/page.tsx` como la nueva Home, traduciendo `home.jsx` sección por sección (hero + silhouettes, feature grid, preview de juegos con `GAMES.slice(0, 6)`, stats, actividad en vivo con datos mock, precios + FAQ, CTA final), usando el hook del paso 5 y las clases del paso 4. Los componentes internos del prototipo (`FloatingSilhouettes`, `MiniCard`, `FeatureIcon`) se traducen como componentes o funciones locales del mismo archivo o en `components/home/`, a criterio de implementación. Todos los CTAs enlazan a las rutas reales indicadas en el scope. Sistema funcional: `/` muestra la Home completa y navegable.
7. Actualizar `components/Nav.tsx`: agregar link "Inicio" → `/` (activo solo en `pathname === "/"`), reapuntar el link "Biblioteca" existente a `/games` (activo en `/games` y `/games/*`), replicar el mismo cambio en el panel móvil. Sistema funcional: el nav distingue correctamente Home de Biblioteca en desktop y móvil.
8. Revisión final: verificar en `npm run dev` que `/`, `/games`, `/games/[id]`, `/games/[id]/jugar`, `/iniciar-sesion` y `/salon-de-la-fama` cargan sin errores, que no quedan referencias a `/juegos` en el código, y que el responsive (<840px) de la Home funciona igual que en el resto de pantallas.

## Acceptance criteria

- [ ] La ruta `/` carga sin errores en consola y muestra la Home (hero, "¿Por qué Arcade Vault?", preview de juegos, stats, actividad en vivo, precios, CTA final).
- [ ] La ruta `/games` carga sin errores y muestra el mismo contenido de Biblioteca que antes vivía en `/` (buscador, chips, grid, estado vacío).
- [ ] La carpeta `app/juegos/` ya no existe y no queda ninguna referencia a `/juegos` en el código (`grep -r "/juegos" app components lib` no devuelve resultados).
- [ ] En la Home, el botón "Explorar juegos" y "Ver todos los juegos →" y el CTA final navegan a `/games`.
- [ ] En la Home, cada tarjeta de preview de juego navega a `/games/<id>` del juego correspondiente.
- [ ] En la Home, "Crear cuenta" y el CTA de precios navegan a `/iniciar-sesion`.
- [ ] En la Home, "Ver salón →" navega a `/salon-de-la-fama`.
- [ ] En `/games/[id]`, "JUGAR AHORA" navega a `/games/[id]/jugar`; en `/games/[id]/jugar`, "salir"/volver navega de regreso a `/games/[id]`.
- [ ] Las secciones de la Home con clase `.reveal` aparecen con la animación de entrada al hacer scroll hasta ellas (se agrega `.in` al entrar en viewport).
- [ ] El nav muestra "Inicio" activo solo en `/`, y "Biblioteca" activo en `/games` y en las rutas `/games/*`.
- [ ] En viewport menor a 840px, la Home es legible y el panel lateral del nav sigue abriendo/cerrando correctamente.
- [ ] `npm run build` completa sin errores de tipo ni de lint.

## Decisions

- **Sí:** mover la Biblioteca a `/games` (en inglés) en vez de `/biblioteca`. Decisión explícita del usuario.
- **Sí:** migrar también las rutas de detalle y reproductor a `/games/[id]` y `/games/[id]/jugar` en vez de dejarlas en `/juegos/[id]`. Razón: evita mezclar inglés (`/games`) y español (`/juegos`) en el mismo árbol de rutas del juego; decisión explícita del usuario.
- **No:** mantener redirecciones desde las URLs viejas `/juegos/...`. Razón: el proyecto no tiene usuarios en producción todavía (spec 01 recién implementado), por lo que no hay URLs externas que romper.
- **Sí:** agregar el link "Inicio" al nav y reapuntar "Biblioteca" a `/games`. Razón: sin esto, la Home quedaría inalcanzable desde el nav una vez que `/` cambia de contenido.
- **No:** incluir la página "Acerca de" (`about.jsx`) en este spec, aunque el nav del prototipo la referencia. Razón: el usuario pidió explícitamente solo la Home; se define en un spec futuro aparte.
- **Sí:** dejar "Actividad en vivo" como mock estático fijo, igual que en el prototipo. Razón: conectarlo a `av_scores`/`seededScores` es una decisión de producto (¿se mezclan puntuaciones reales con las simuladas? ¿cómo se ordenan?) que amerita su propio spec, no una extensión implícita de este.
- **Sí:** reutilizar `GAMES` de `lib/games.ts` para el preview de juegos de la Home en vez de duplicar datos. Razón: es el mismo dato que ya usa la Biblioteca; duplicarlo generaría desincronización.
- **No:** rediseñar visualmente la Home más allá de lo que ya define el prototipo. Cualquier ajuste de diseño nuevo se evalúa con el skill `/frontend-design` durante la implementación, no en este spec.

## Identified risks

- Migrar `app/juegos/[id]` a `app/games/[id]` cambia el tipo generado `PageProps<"/juegos/[id]">` a `PageProps<"/games/[id]">`; si se olvida actualizar ese tipo, `npm run build` fallará por tipos de ruta desincronizados. Mitigación: paso 1 del plan lo actualiza explícitamente y el criterio de aceptación de `npm run build` lo cubre.
- Si queda algún link hardcodeado a `/juegos/...` sin actualizar (por ejemplo en `salon-de-la-fama` si en el futuro enlaza a juegos), la navegación llevaría a un 404. Mitigación: criterio de aceptación explícito de `grep` sin resultados para `/juegos`.
