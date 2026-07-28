# PROMPT MAESTRO — givemymovies

**Documento v1.1 · Aplicación V GMM 0001 · 27 de julio de 2026**

---

## 0. Cómo usar este documento

Es una **especificación ejecutable**: contiene todo lo necesario para construir
`givemymovies` desde cero, sin haber visto el proyecto ni la conversación que lo originó.
Está escrito en imperativo y no deja decisiones al criterio de quien lo lea.

- **Para construirlo desde cero:** léelo entero y ejecútalo de la §1 a la §11.
- **Para modificarlo:** lee §3 (restricciones), §4 (decisiones fundacionales) y la sección
  del área que vas a tocar. Al terminar, aplica §14.
- **Para entender por qué algo es como es:** §4 explica cada decisión con su alternativa
  descartada. El Anexo A guarda las peticiones originales del usuario, literales.

> **Regla de oro.** Este documento describe el proyecto **tal como está ahora**, no su
> historia. Si algo cambia, se reescribe la sección afectada en presente y se anota en §15.

---

## 1. Resumen ejecutivo

Construye **givemymovies**: una aplicación web de una sola página que responde a la pregunta

> **¿Dónde puedo ver esta película, y en mi idioma?**

El usuario busca por **título**, por **actor o actriz** o por **trama**, y obtiene en qué
**plataformas de streaming** y en qué **países** está disponible, filtrado por **idioma**,
con la carátula y un resumen en lenguaje natural. Puede guardar títulos en dos listas
(**favoritas** y **pendientes**) y preguntar dónde ver sus pendientes en cualquier momento.

Es **un único archivo `index.html`**, sin librerías ni instalación: se abre con doble clic.

---

## 2. El problema

Las webs que hoy resuelven esto (JustWatch y similares) tienen tres carencias:

1. **Obligan a elegir un país cada vez.** Si no sabes en cuál está, vas probando.
2. **No dicen nada del idioma.** Saber que está en Netflix Japón no te sirve de nada si
   necesitas español.
3. **No cruzan actor con disponibilidad.** Puedes ver la filmografía de alguien, o dónde ver
   una película, pero no las dos cosas a la vez.

`givemymovies` responde a las tres de una vez y en una sola pantalla.

---

## 3. Restricciones técnicas innegociables

Acordadas explícitamente con el usuario. **No las reinterpretes ni las "mejores".**

| # | Restricción | Detalle |
|---|---|---|
| R1 | **Un único `index.html`** | HTML, CSS y JavaScript en el mismo archivo. Debe abrirse con doble clic, sin servidor, sin build, sin instalación. |
| R2 | **CSS puro, sin variables** | Prohibidas las propiedades personalizadas: nada de `var(--color)`, `--fuente`, `--espaciado`. Escribe el valor literal cada vez, aunque se repita cincuenta veces. |
| R3 | **Sin librerías** | Ni frameworks, ni CDNs, ni paquetes npm, ni fuentes externas. JavaScript nativo y tipografía del sistema. |
| R4 | **Scripts clásicos** | Nunca `type="module"`. Los módulos ES fallan al abrir con `file://`, que es el modo de uso previsto. |
| R5 | **Preparado para fraccionar** | El archivo debe estar dividido en bloques delimitados por banners de comentario que nombren el archivo al que irían. Separarlos debe ser copiar y pegar, **sin tocar una sola línea de código**. |
| R6 | **Todo el código en español** | Comentarios, variables, funciones, clases CSS, identificadores. Ejemplos: `pintarPelicula`, `cerrarSugerencias`, `entrada`, `capaAjustes`, `.boton-buscar`, `.pais-codigo`. |
| R7 | **La app no tiene dependencias** | Si añades herramientas de verificación, van en una carpeta aparte con su propio `package.json`. La aplicación en sí nunca requiere instalar nada. |

---

## 4. Decisiones fundacionales

Cada una se planteó al usuario con sus alternativas. Estas son las elegidas y su porqué.

### 4.1 Fuente de datos → TMDB con clave del usuario

**Decisión.** Usa la API de [TMDB](https://www.themoviedb.org) (gratuita), que distribuye los
datos de disponibilidad de JustWatch. La clave la introduce el usuario en un modal de ajustes
y se guarda en `localStorage`.

**Además, incluye un modo demo** con un catálogo de ejemplo embebido, activo cuando no hay
clave, para que la aplicación funcione desde el primer segundo sin registrarse en nada.

**Por qué.** IMDb no abre su API a desarrolladores; TMDB sí, y su acuerdo con JustWatch es lo
que permite responder «dónde verla» en ~90 países.

**Alternativas descartadas.**
- *Solo datos de demo*: la aplicación conocería únicamente las películas escritas a mano y
  envejecería en cuanto cambiara un catálogo.
- *Backend propio con la clave oculta*: más seguro para publicar, pero rompe R1 (haría falta
  arrancar un servidor).

**Advierte al usuario**, sin dramatizar, de que la clave queda visible en el código si algún
día publica la web, y de que eso se resolvería con un pequeño servidor intermedio.

### 4.2 Stack → un único archivo, sin librerías

**Decisión.** Ver §3, restricciones R1 a R7.

**Por qué.** El usuario quiere abrir el archivo y que funcione, poder compartirlo tal cual, y
conservar la opción de dividirlo más adelante cuando crezca.

**Alternativa descartada.** *React + Vite*: mejor si el proyecto creciera mucho, pero exige
Node, `npm install` y `npm run dev` cada vez. Incompatible con «doble clic y funciona».

### 4.3 Tratamiento del idioma → deducción por mercado, declarada

**Esta es la decisión más importante del proyecto. No la cambies sin entenderla.**

**El problema.** Ninguna API pública informa de las pistas de audio o subtítulos de una ficha
concreta. TMDB y JustWatch dicen **país** y **plataforma**, nunca **idioma**. Es decir: el
dato que el usuario más quiere es precisamente el que no existe.

**Decisión.** Dedúcelo del mercado del país, y **dilo abiertamente en la interfaz**.

**Por qué.** Es preferible ser honesto sobre el límite que aparentar un dato que no se tiene.
Un usuario que sabe que es una estimación la usa bien; uno que la cree confirmada, no.

**Alternativas descartadas.**
- *Deducir en silencio*: interfaz más limpia, pero el usuario creería que es un dato oficial.
- *Idioma solo como ordenación*: nunca ocultaría resultados, pero el filtro pierde fuerza,
  que es justo lo que se pedía.

#### Algoritmo de evaluación

Para cada país con oferta, con `idiomaBuscado` e `idiomaOriginal` de la película:

```
1. Si no hay idiomaBuscado          → nivel "neutro",  sin etiqueta.
2. idiomasMercado = IDIOMAS_PAIS[país] (lista ordenada; el primero es el principal).
3. posicion  = índice de idiomaBuscado dentro de idiomasMercado (-1 si no está).
4. esOriginal = (idiomaOriginal == idiomaBuscado).

5. Si posicion == 0  → nivel "alto"
                       etiqueta = esOriginal ? "Audio original"
                                             : "Doblada y subtitulada"
6. Si posicion > 0   → nivel "medio",  etiqueta "Idioma cooficial del mercado"
7. Si esOriginal     → nivel "medio",  etiqueta "Audio original de la película"
8. En otro caso      → nivel "bajo",   etiqueta "Poco probable en este idioma"
```

#### Reglas de presentación

- Los países de nivel **`bajo` se ocultan**, salvo que el usuario pulse *ver todos*.
- Ordena los visibles por nivel (`alto` → `medio` → `neutro` → `bajo`) y, dentro de cada
  nivel, alfabéticamente por nombre de país en español.
- Muestra **siempre** este aviso cuando haya un idioma seleccionado, con este texto:

  > El idioma es una **estimación por mercado**: las plataformas no publican qué pistas de
  > audio lleva cada ficha, así que deducimos el idioma del país donde se ofrece. Confirma
  > siempre en la plataforma antes de darle al play.

- **Este aviso no se retira nunca**, por mucho que se pula el diseño.

---

## 5. Especificación funcional

### 5.1 Buscador

**5.1.1 Tres modos**, en pestañas: `Película` · `Actor / Actriz` · `Trama / Tema`.
Cambiar de pestaña cambia el texto de ejemplo del campo, los chips sugeridos, y limpia el
campo y los resultados.

**5.1.2 Campo de texto con autocompletado.**

- Retardo de **350 ms** desde la última tecla; mínimo **2 caracteres**.
- Cada sugerencia muestra miniatura, título y año (o «Actor / Actriz» en modo persona).
- Máximo **7 sugerencias**.
- En modo *Trama* no hay autocompletado: no aportaría nada útil.
- Teclado: `↓`/`↑` recorren, `Enter` acepta la marcada o lanza la búsqueda si no hay ninguna,
  `Escape` cierra.
- **Al lanzar una búsqueda, cancela la petición retardada pendiente.** Si no, el desplegable
  se reabre encima de los filtros justo después de mostrar el resultado.
- **Cierra el desplegable también al perder el foco**, con ~160 ms de margen para que un clic
  sobre una sugerencia llegue a registrarse. Sin esto, la lista tapa el botón *Buscar*.

**5.1.3 Tres filtros.**

| Filtro | Obligatorio | Contenido |
|---|---|---|
| Plataforma | No | «Todas las plataformas» + catálogo. Marcado visualmente como *opcional* |
| País | No | «Todos los países» + países agrupados en 6 regiones, nombres en español |
| Idioma | Sí | 13 opciones, empezando por «Cualquier idioma». Por defecto **Español** |

**Cambiar cualquier filtro recalcula el resultado al instante, sin volver a llamar a la API.**
Los datos ya están en memoria; solo hay que volver a filtrar y repintar.

**5.1.4 Chips de ejemplo** bajo el campo, distintos según la pestaña. Al pulsarlos, buscan.

### 5.2 Resultado: modo película

Pinta en este orden exacto:

**1 · Frase resumen.** El elemento más visible. Construida así:

```
1. Agrupa al revés de como vienen los datos: plataforma → lista de países.
   (Es como lo diría una persona: "en Netflix, en Argentina y México".)
2. Ordena las plataformas por número de países, de más a menos.
3. Toma las 6 primeras. De cada una, hasta 4 países; el resto como "+N".
4. Enumera en español correcto: "A, B y C".
5. Si quedan plataformas fuera, añade ", y en N plataformas más".

Resultado:  "{Título} en {idioma} la puedes ver en {Plataforma} ({países}), … ."
```

Casos sin resultado:

| Situación | Texto |
|---|---|
| Está en otros países, pero ninguno sirve ese idioma | «*{Título}* está disponible en N países, pero en ninguno cuyo catálogo se sirva en {idioma}.» |
| No está en ninguna parte con esos filtros | «No encontramos *{Título}* en {idioma} en ninguna plataforma con estos filtros.» |

**2 · Ficha.** Imagen de fondo difuminada, carátula, título, título original si difiere, año,
duración, nota, idioma original y sinopsis.

**3 · Botones de listas.** ♥ Favorita · 🔖 Pendiente de ver.

**4 · Aviso de estimación de idioma** (§4.3).

**5 · Tarjetas por país.** Una por país, en cuadrícula. Cada una:
- Pastilla con el código ISO de dos letras.
- Nombre del país en español, vía `Intl.DisplayNames`.
- Insignia de confianza del idioma (§4.3).
- Plataformas **separadas por tipo de acceso**, en este orden: *Incluida en la suscripción* ·
  *Gratis* · *Gratis con anuncios* · *Alquiler* · *Compra*.
- Cada plataforma con su logo y enlace directo a la ficha.

**6 · Salidas de emergencia.** Si el idioma dejó países fuera, botón
«Ver también los N países en otros idiomas», y su inverso para volver a filtrar.

**7 · Otras coincidencias.** Si la búsqueda devolvió varias películas, muestra la mejor y bajo
ella una cuadrícula con hasta 12 alternativas.

### 5.3 Resultado: modo actor o actriz

- Ficha con foto, nombre, número de películas y biografía recortada a ~420 caracteres.
- **Filmografía** en cuadrícula de carátulas, ordenada por popularidad.
- Botón **«¿Dónde puedo ver sus películas?»**:
  - Consulta los **24 títulos más populares**.
  - **Máximo 5 peticiones simultáneas.**
  - Barra de progreso con «Consultando disponibilidad… N de M».
  - Al terminar: «Listo: N de M disponibles con tus filtros».
  - Cada carátula queda etiquetada con hasta 3 plataformas, y «+N» si hay más.
- Clic en una carátula → modal con el detalle completo de esa película.

### 5.4 Resultado: modo trama

TMDB **no busca dentro del texto de la sinopsis**. Lo más cercano que existe es su sistema de
palabras clave. Por tanto:

```
1. Busca el texto en /search/keyword.
2. Toma las 3 primeras claves y pide /discover/movie?with_keywords=id1|id2|id3
   ordenado por popularidad.
3. Si no hay ninguna clave, cae a una búsqueda normal por título.
```

Muestra hasta 24 resultados en cuadrícula.

### 5.5 Mis listas

- **Dos listas independientes:** ♥ **Favoritas** y 🔖 **Pendientes de ver**. Un título puede
  estar en ambas a la vez.
- **Botones de alternar en todas partes:** ficha grande, carátulas de cuadrícula, filmografía
  y modal. En las carátulas aparecen al pasar por encima; si el título ya está guardado, se
  ven siempre.
- **Acceso desde la cabecera**, con contador de la suma de ambas listas.
- **Vista propia** con las dos listas, quitar título individual y vaciar lista con confirmación.
- **Botón «¿Dónde puedo verlas ahora?»** sobre las pendientes: mismo mecanismo por lotes de
  §5.3, aplicando los filtros de idioma y plataforma actuales. Es lo que convierte la lista en
  algo vivo en lugar de un cajón.
- **Exportar / importar JSON** desde ajustes. Las listas viven solo en `localStorage` y un
  borrado de datos del sitio se las lleva; la copia de seguridad cuesta poco y evita el disgusto.
- Al importar, **fusiona sin duplicar**; rechaza archivos con formato ajeno.

### 5.6 Ajustes

Modal con:
- Campo para la clave de TMDB, con instrucciones numeradas de cómo obtenerla.
- Advertencia sobre la visibilidad de la clave si se publica la web.
- Exportar e importar listas.

La cabecera muestra una pastilla de estado: **«Modo demo»** (naranja) o **«Datos en vivo»**
(verde).

### 5.7 Estados y errores

| Estado | Comportamiento |
|---|---|
| Cargando | Esqueletos animados con brillo, no un texto «cargando» |
| Bienvenida | Explica qué buscar y en qué modo está (demo o en vivo) |
| Sin resultados | Sugiere qué probar; distinto según el modo |
| Clave inválida (401) | Mensaje claro + botón que abre ajustes |
| Límite de peticiones (429) | Aviso de esperar unos segundos |
| Error de red | Aviso flotante, sin vaciar lo que ya se veía |
| Acciones | Avisos flotantes efímeros (~3,2 s) |

---

## 6. Especificación visual

**Paleta oscura con verdes, naranjas y azules.** Valores literales, nunca variables CSS (R2):

```
Fondo profundo   #0b0f14      Verde    #2ee6a8   disponible, suscripción, confianza alta
Superficie       #131c26      Naranja  #ff8a3d   alquiler, compra, avisos, "opcional"
Superficie alta  #1a2632      Azul     #4aa8ff   info, anuncios, enlaces, pendientes
Bordes           #22303e      Texto    #e8f0f8   apagado #8ba0b6   tenue #5e768c
Borde claro      #2f4356      Verde ✓  #6ff0c4   Azul ✓ #8fc9ff    Naranja ✓ #ffb37d
```

**Reglas:**

- **Degradados que mezclan los tres colores** en: marca, botón *Buscar*, pestaña activa y
  barra de progreso.
- **Fondo** con tres resplandores radiales sutiles, uno por color.
- **Interactivo y agradable**: elevación al pasar por encima, transiciones de 0,15–0,18 s,
  esqueletos con brillo recorrido, foco siempre visible.
- **Prohibidos los emojis de bandera.** En Windows se muestran como dos letras sueltas. Usa
  una pastilla con el código ISO del país.
- **Tarjetas de país con `align-items: start`**, o la cuadrícula las estira a la altura de la
  más alta de la fila y deja huecos vacíos muy visibles.
- **Responsive real**: cortes en 860 px y 620 px. A 375 px, **cero desbordamiento horizontal**.
- **Respeta `prefers-reduced-motion`.**

---

## 7. Arquitectura del código

Bloques delimitados por banners de comentario que nombran su futuro archivo (R5).

**CSS, dentro de `<style>`:**

| # | Destino | Contenido |
|---|---|---|
| 1 | `css/base.css` | Reset, body, scrollbar, foco, utilidades |
| 2 | `css/header.css` | Cabecera, marca, pastilla de modo, contador |
| 3 | `css/buscador.css` | Pestañas, campo, autocompletado, filtros, chips |
| 4 | `css/resultados.css` | Resumen, ficha, países, cuadrícula, persona, esqueletos |
| 5 | `css/modales.css` | Capas, modales, avisos flotantes, pie |
| 6 | `css/responsive.css` | 860 px, 620 px, `prefers-reduced-motion` |

**JavaScript, dentro de `<script>`.** Todo cuelga del objeto global `GMM`, de modo que separar
los bloques en archivos **no exija tocar código**: basta enlazarlos en este orden.

| # | Destino | Objeto | Responsabilidad |
|---|---|---|---|
| 1 | `js/config.js` | `GMM.config` | Constantes, claves de `localStorage`, tipos de oferta, idiomas |
| 2 | `js/datos.js` | `GMM.datos` | Mapa país→idiomas, grupos regionales, plataformas, alias |
| 3 | `js/demo.js` | `GMM.demo` | Catálogo de ejemplo |
| 4 | `js/util.js` | `GMM.util` | Escapado, normalizar, enumerar, retardo cancelable, lotes |
| 5 | `js/tmdb.js` | `GMM.tmdb` | Peticiones, caché, conmutación demo/vivo |
| 6 | `js/idioma.js` | `GMM.idioma` | **El núcleo**: evaluar, filtrar, construir la frase |
| 7 | `js/listas.js` | `GMM.listas` | Favoritas y pendientes |
| 8 | `js/ui.js` | `GMM.ui` | Componentes, avisos |
| 9 | `js/app.js` | `GMM.app` | Estado, vistas, eventos, arranque |

**Reglas de código:**

- Escapa **siempre** el texto que vaya a `innerHTML` (`GMM.util.esc`).
- Los comentarios explican **por qué**, no qué. Sobre todo en el bloque 6.
- Un único objeto `estado` en `GMM.app`. Cambiar un filtro llama a `repintarVista()`, que
  recalcula sobre lo que ya hay en memoria.

---

## 8. Modelo de datos

**Endpoints de TMDB:**

| Uso | Endpoint |
|---|---|
| Buscar película | `/search/movie` |
| Buscar persona | `/search/person` |
| Filmografía | `/person/{id}/movie_credits` |
| Ficha | `/movie/{id}` |
| **Dónde verla** | `/movie/{id}/watch/providers` ← el dato central |
| Trama | `/search/keyword` → `/discover/movie?with_keywords=` |
| Catálogo de plataformas | `/watch/providers/movie` |

Todas con `language=es-ES`. Caché en memoria por ruta + parámetros.

**Persistencia en `localStorage`:**

| Clave | Contenido |
|---|---|
| `gmm_tmdb_key` | Clave de la API |
| `gmm_prefs` | Modo, plataforma, país e idioma |
| `gmm_listas` | `{ favoritas: [], pendientes: [] }` |

**Mapa país → idiomas.** Lista ordenada por país, con el idioma principal primero. Cubre
Hispanoamérica, Europa, Norteamérica, países lusófonos, Asia-Pacífico y Medio Oriente.
Ejemplos: `AR: ["es"]`, `US: ["en","es"]`, `CA: ["en","fr"]`, `CH: ["de","fr","it"]`.

**Alias de plataformas.** El sector renombra sus servicios y el filtro debe seguirles el
rastro: `Max` ↔ `HBO Max`, `Prime Video` ↔ `Amazon Prime Video`, `Disney+` ↔ `Disney Plus`,
`Apple TV+` ↔ `Apple TV Plus`, `Star+` ↔ `Star Plus`.

**Catálogo demo.** Ocho películas con proveedores por país, y tres intérpretes. Elige títulos
que **demuestren el filtro de idioma**: alguno disponible en países hispanohablantes y en
otros que no lo son, y alguno cuyo idioma original no sea el inglés.

---

## 9. Cómo debe comportarse quien lo construya

Estas reglas son parte del acuerdo, no adorno.

1. **Presenta el plan antes de escribir código.** El usuario lo pide expresamente.
2. **Pregunta solo lo que cambia el trabajo.** En su momento fueron tres cosas: fuente de
   datos, stack y tratamiento del idioma (§4).
3. **Explica los conceptos técnicos en llano.** Cuando pregunte «qué es TMDB» o similar,
   responde qué es, qué cuesta, qué alternativa hay y qué implica. Sin condescendencia y sin
   dar nada por sabido.
4. **Si dice «espera», para de verdad** en ese punto, y di en qué estado quedó todo.
5. **Acepta requisitos que lleguen tarde.** Las listas de favoritas y pendientes se pidieron
   después de aprobar el plan: se incorporaron y se actualizó el plan.
6. **Entrega sugerencias de mejora priorizadas**, separando lo ya incluido de lo propuesto.
7. **Verifica antes de afirmar que funciona** (§10).
8. **Declara los límites en vez de disimularlos** (§12).

---

## 10. Verificación

**La aplicación no tiene dependencias** (R7). Las pruebas van en `pruebas/`, como herramienta
aparte y opcional, con su propio `package.json`.

```bash
node pruebas/logica.js      # sin dependencias · instantáneo
node pruebas/imagenes.js    # necesita internet
node pruebas/interfaz.js    # necesita playwright-core; si falta, avisa y sale sin fallar
```

- `pruebas/cargar.js` extrae el `<script>` de `index.html` y lo ejecuta con
  **`vm.runInThisContext`, nunca `eval`**: el `"use strict"` del script hace que `eval` cree
  su propio ámbito y `GMM` saldría `undefined`.
- `pruebas/interfaz.js` reutiliza un Chromium ya descargado en la caché de Playwright y deja
  capturas en `pruebas/capturas/`.

### Criterios de aceptación

Todos deben pasar:

| # | Comprobación | Resultado esperado |
|---|---|---|
| A1 | `Interestelar` + español, sin más filtros | 6 países; 4 ocultos por idioma; la frase nombra Netflix y Max |
| A2 | Insignias en A1 | Argentina «Doblada y subtitulada» (alto); Estados Unidos «Idioma cooficial» (medio) |
| A3 | Añadir plataforma `Netflix` | Se reduce a Argentina, Chile y México, **sin recargar** |
| A4 | Idioma `japonés` | **Solo Japón** — es su mercado, debe aparecer |
| A5 | Idioma `árabe` | Ningún país; aviso de que está en 10 pero ninguno lo sirve, con salida |
| A6 | «Ver todos los países» | Aparecen los 10; el botón inverso vuelve a 6 |
| A7 | Guardar en listas | El contador sube, el botón cambia de texto, **sobrevive a recargar** |
| A8 | Modo actor | Filmografía visible y barra de progreso completándose hasta «Listo: N de M» |
| A9 | Modal de detalle | Abre, trae países, cierra con `Escape` |
| A10 | Autocompletado tras buscar | **No reaparece** encima de los filtros |
| A11 | Ancho de 375 px | Cero desbordamiento horizontal |
| A12 | Toda la sesión | **Cero errores de JavaScript en consola** |

### Al tocar el catálogo demo, verifica cada imagen

**Un HTTP 200 en `image.tmdb.org` no prueba que la imagen sea de esa película.** En este
proyecto ya falló dos veces:

- El id `1417` **no** es *Volver*, es *El laberinto del fauno*. El correcto es **219**.
- El id `1281` **no** es Penélope Cruz, es Freddie Highmore. El correcto es **955**.

La comprobación fiable: lee `og:title` y `og:image` de
`themoviedb.org/movie/{id}?language=es-ES`. **No cojas el primer `<img>` de la página**, que
suele ser un recomendado. Y pide siempre el **mismo idioma que usa la app**, porque TMDB
sirve una carátula distinta según el locale.

---

## 11. Entregables

| Archivo | Contenido |
|---|---|
| `index.html` | La aplicación completa. Versión en el pie, en `#version-app`, formato `V GMM XXXX` |
| `README.md` | Manual: cómo obtener la clave de TMDB, los tres modos, guía de fraccionamiento, límites |
| `CLAUDE.md` | Contexto para sesiones futuras. **Fuente de verdad de la versión** |
| `PROMPT-MAESTRO.md` | Este documento |
| `pruebas/` | `cargar.js`, `logica.js`, `imagenes.js`, `interfaz.js`, `clave.js`, `LEEME.md` |
| `.gitignore` | Excluye `node_modules` de las pruebas y las capturas |

Más un **skill de cierre de versión** en `~/.claude/skills/givemymovies-commit/SKILL.md`, que
tras cada cambio sube la versión del pie, actualiza `CLAUDE.md` y este documento, ejecuta las
pruebas que correspondan y ofrece el commit. Existe porque estos dos documentos no se
actualizan solos y quedan desfasados en cuanto alguien se despista.

---

## 12. Límites declarados

Hay que **decirlos**, no disimularlos:

- **Precios de alquiler y compra**: TMDB no los publica. Requeriría la API de pago de JustWatch.
- **Búsqueda por trama**: usa palabras clave, no el texto de la sinopsis. Funciona con
  conceptos, no con frases largas.
- **Solo películas**: aún no hay series.
- **Filmografías**: se consultan los 24 títulos más populares, no la obra completa.
- **La clave viaja al navegador**: publicar la web exigiría un servidor intermedio.
- **El idioma es una estimación**, nunca un dato confirmado (§4.3).

---

## 13. Mejoras futuras, por valor

1. **Series además de películas.** Misma API, duplica el alcance. La más rentable con diferencia.
2. **Enlace compartible.** Codificar la búsqueda en la URL.
3. **Avísame cuando llegue.** Vigilar un título hasta que aparezca en tu país. Necesita servidor.
4. **Tráiler incrustado.** `/movie/{id}/videos`, un clic sin salir de la app.
5. **Comparador de países.** Útil para quien usa VPN.
6. **Sorpréndeme.** Película al azar que cumpla los filtros activos.
7. **Filtros avanzados.** Género, año, nota mínima, duración.
8. **PWA instalable.** Icono en el móvil y caché de las últimas búsquedas.

*Ya incluidas desde la primera versión, por baratas y por lo mucho que cambian la experiencia:*
autocompletado con carátula, frase en lenguaje natural, enlace directo a cada plataforma,
distinción suscripción/alquiler/compra, nombres de país en español, filtros recordados entre
sesiones y navegación por teclado.

---

## 14. Mantenimiento de este documento

**Lo hace el skill `givemymovies-commit`.** Invócalo tras cada cambio en lugar de editar esto
a mano. Lo que sigue es lo que ejecuta, por si hay que hacerlo manualmente:

1. **Reescribe en presente la sección afectada.** Si se añaden series, §1 deja de decir «solo
   películas» y §12 pierde ese límite. No acumules histórico dentro de las secciones.
2. **Mueve las mejoras que se implementen** de §13 a la especificación que corresponda.
3. **Añade su criterio de aceptación** a la tabla de §10.
4. **Sube la versión** de la cabecera: menor para añadidos, mayor si cambia el concepto.
5. **Anota la línea en §15.**
6. **Mantén el estilo de instrucción**, en imperativo. Esto no es un diario: es lo que permite
   reconstruir el proyecto.
7. **Sincroniza con `CLAUDE.md`**, con el que comparte varias secciones.
8. **Nunca borres el porqué de §4.3.** Es el corazón del proyecto.

---

## 15. Registro de cambios

| Doc | App | Fecha | Cambio |
|---|---|---|---|
| 1.1 | V GMM 0001 | 27-07-2026 | Reorganización completa del documento a especificación explícita y verificable: algoritmos escritos paso a paso, criterios de aceptación numerados (A1–A12), decisiones con sus alternativas descartadas. Las peticiones literales del usuario bajan al Anexo A como trazabilidad. |
| 1.0 | V GMM 0001 | 27-07-2026 | Versión inicial. Buscador en tres modos, filtros de plataforma/país/idioma, deducción de idioma por mercado con insignias de confianza, fichas con carátula, filmografía con consulta en lote, listas de favoritas y pendientes con exportar/importar, modo demo de 8 películas. Añadidos `CLAUDE.md`, este documento, la carpeta `pruebas/` (118 comprobaciones), versión visible en el pie y el skill `givemymovies-commit`. |

---

# Anexo A — Peticiones originales (trazabilidad)

> Aquí se conservan las palabras exactas del usuario. **No son la especificación** —esa es la
> §5, ya interpretada y ordenada—, sino su origen. Sirven para comprobar, ante una duda, que
> lo especificado responde a lo que de verdad se pidió.

**A.1 — Petición inicial**

> quiero una app buscador que a partir del nombre de una pelicula o referencia del actor
> trama me permita conocer en que plataforma de streaming la estan pasando o en que pais la
> estan pasando segun la plataforrma elegida y el idioma seleccionado. un input donde ponga
> la pelicula Interestelar, otro la plataforma neflix (es opcional puedo no colocarla y me
> dara todas las plataformas disponibles), pais tambien es opcional, idioma: espanol, el
> resultado pudiese ser: en neflix Interestelar en idioma espanol la puedes ver en argentina.
> o puedes ver Interestelar en espanol en hbo colombia, prime neflix y peackot mexico, disney
> espana. es solo un ejemplo tambiem que me permita a partir del nombre de un actor o atriz
> ver todas las peliculas que realizo y donde puedo verlas (plartaformas y pais) segun el
> idioma selecionado, dame sugerencias de mejora. tambien que pueda ver la caratula de la
> pelicula, has algo interativo agradable con una paleta de colores dark con verdes naranjas
> y azules el proyecto se llamara givemymovies

→ Interpretado en §1, §5.1, §5.2, §5.3, §6 y §13.

**A.2 — Respuesta sobre el stack**

> html, css puro sin declarar variables para colores tamanos fuentes ni nada, js, sin
> librerias no se que es js vainilla todo en un unico index que permita luego fraccionar

→ Interpretado en §3 (restricciones R1 a R6) y §7.

**A.3 — Requisito añadido tras aprobar el plan**

> adicional quiero que cada pelicula quede almacenada en una lista de favoritas o pendientes
> para ver

→ Interpretado en §5.5.

**A.4 — Sobre este mismo documento**

> quiero el prompt lo mas claro y explicito posible

→ Motivo de la reorganización a v1.1: la especificación es explícita y verificable, y las
citas literales quedan aquí como trazabilidad, no como fuente de la que deducir requisitos.
