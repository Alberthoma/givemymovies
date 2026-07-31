# CLAUDE.md — givemymovies

> Contexto del proyecto para cualquier sesión futura. Léelo entero antes de tocar código.

**Versión activa:** `V GMM 0023`
**Próxima versión:** `V GMM 0024`
**Última actualización:** 2026-07-30

**Publicada en:** <https://alberthoma.github.io/givemymovies/> · GitHub Pages desde `main`, raíz.

> **Antes de tocar el código de una versión publicada, respáldala.** Copia `index.html`,
> `sw.js` y `manifest.json` a `respaldos/V-GMM-XXXX/` y **commitéalo** (los iconos no: apenas
> cambian y ya los conserva git en `iconos/`). Los respaldos se versionan en git a propósito,
> para que la copia sobreviva a un cambio que salga mal se trabaje desde donde se trabaje,
> también desde un entorno remoto y efímero. Detalle en `respaldos/LEEME.md`.

> **Después de cualquier cambio, ejecuta el skill `givemymovies-commit`.** Sube la versión,
> actualiza este archivo y `PROMPT-MAESTRO.md`, y pasa las pruebas. No lo hagas a mano:
> el protocolo tiene pasos que es fácil olvidar.

---

## 1. De qué va

**givemymovies** responde a una pregunta concreta que hoy ninguna web resuelve bien:

> **¿Dónde puedo ver esta película, y en mi idioma?**

JustWatch y similares te obligan a cambiar de país a mano, plataforma por plataforma, y
nunca te dicen el idioma. Aquí se responde de una vez, en una frase en lenguaje natural:

> *Interestelar en español la puedes ver en **Netflix** (Argentina, Chile y México),
> **Max** (Argentina, Chile y Colombia) y **Movistar Plus+** (España).*

**Un interruptor global Película / Serie** (naranja / azul) manda sobre todo lo demás
(desde V GMM 0006). Debajo, **dos formas de llegar al mismo resultado —dónde verla—**:

| Forma | Cómo | Salida |
|---|---|---|
| **Buscar una en concreto** | Desplegable *por título · por actor/actriz · por trama* + campo de texto | Ficha (título), filmografía (actor) o cuadrícula (trama), del tipo elegido |
| **Descubrir por género** | Género + **intervalo de años** (desde–hasta, opcional) + nota mínima + **orden** | Cuadrícula **paginada** (20 por página, con Anterior/Siguiente) de todo lo que encaja (`/discover`) |

Plataforma y país son **opcionales**; el idioma es el filtro que da sentido a todo.

**Los controles de las dos formas viven en un modal** (desde V GMM 0022): en el inicio solo se
ven dos botones del mismo tamaño, y cada uno abre el **modal-formulario** con sus campos. Ver §4.

**Encima de las dos formas, cinco carruseles de descubrimiento** (desde V GMM 0017; **cinco a la
vez desde la 0023**) responden «¿y qué veo?» sin buscar nada: bajo el header, en el inicio, uno
por categoría —*Tendencia*, *Las 20 de siempre* (2000→hoy), *Nunca es tarde* (1980–2000),
*Clásicos* (1950–1979) y *Lo que prefieres* (tus favoritas)—, con **20 títulos cada uno** y la
**nota de TMDB** en la esquina de cada carátula. Respetan el interruptor peli/serie y, al tocar
una tarjeta, abren la **ficha completa** (la misma vista que buscar por título; desde V GMM 0018).

**El interruptor peli/serie afecta a las dos formas y a las tres búsquedas** (título, actor,
trama): buscar *The Walking Dead*, la filmografía en TV de un actor, o tramas en series, todo
va según el interruptor. La app es «consciente del tipo»: cada ficha lleva
`tipo: "movie" | "tv"` y `GMM.util.normalizarMedia` copia los campos de serie (`name`,
`first_air_date`, `episode_run_time`) a los de película, de modo que el pintado no distingue
unos de otras. El interruptor solo tiñe **sus propios acentos** (él mismo, el método activo y
el botón *Buscar*); el resto de la paleta no cambia.

---

## 2. La decisión que define el proyecto

**El idioma no es un dato: es una deducción, y hay que decirlo.**

Ninguna API pública informa de las pistas de audio o subtítulos de una ficha concreta.
TMDB sirve los datos de JustWatch, que dicen *país* y *plataforma*, nunca *idioma*.

La app lo resuelve deduciéndolo del mercado del país, y **lo declara abiertamente**:

| Insignia | Cuándo se aplica | Nivel |
|---|---|---|
| **Audio original** | El idioma buscado es el original de la película y el país lo sirve | `alto` |
| **Doblada y subtitulada** | Es el idioma principal de ese mercado (es → AR, MX, ES…) | `alto` |
| **Idioma cooficial del mercado** | El país lo sirve, pero no es el principal (es → US; fr → CA) | `medio` |
| **Poco probable en este idioma** | No encaja; se oculta, con botón de escape | `bajo` |

Vive en el bloque JS 6 (`GMM.idioma`), y el mapa está en `GMM.datos.IDIOMAS_PAIS`.

**El mismo principio rige el «sin resultados».** `filtrar()` devuelve `descartadosPorPlataforma`:
los países que sí tienen oferta pero la pierden por el filtro de plataforma. Permite responder
«está en 14 países, **pero no en Netflix**» en vez de un «no hay resultados» que es cierto e
inútil. Mantén esa distinción: decir *por qué* no hay nada es la mitad del valor de la app.

**Nunca elimines el aviso de "estimación por mercado" de la interfaz.** Fue una condición
acordada: es preferible ser honesto sobre el límite que aparentar un dato que no tenemos.

---

## 3. Preferencias del usuario (obligatorias)

Estas no son sugerencias. Se acordaron explícitamente y hay que respetarlas.

| Preferencia | Detalle |
|---|---|
| **Un único `index.html`** | Todo dentro: HTML, CSS y JS. Se abre con doble clic, sin servidor. **Única excepción:** `manifest.json`, `sw.js` e `iconos/`, que por definición tienen que ser archivos aparte para que la app sea instalable. Nada de lógica de la app vive en ellos. |
| **Preparado para fraccionar** | Bloques delimitados con banners de comentario que nombran su futuro archivo. |
| **CSS puro, sin variables** | Nada de `var(--color)`, `--espaciado` ni similares. **Valores literales siempre**, aunque se repitan. Petición textual del usuario. |
| **Sin librerías** | Ni frameworks, ni CDNs, ni npm. JavaScript a pelo. |
| **Scripts clásicos** | Nada de `type="module"`: rompería la apertura con `file://`. |
| **Todo en español** | Comentarios, variables, funciones, clases CSS, identificadores. `pintarPelicula`, `entrada`, `capaAjustes`, `boton-buscar`. |
| **Paleta oscura** | Verdes, naranjas y azules. Ver §5. |
| **Plan antes de crear** | El usuario pide ver el plan antes de que se escriba código. No te adelantes. |

### Cómo trabaja el usuario

- **Interrumpe a mitad de turno.** Dice «espera», «dime primero tu plan», «qué es TMDB».
  Cuando lo haga, **para de verdad**, responde a lo que pregunta y no sigas hasta que lo diga.
- **Pregunta por conceptos técnicos.** No des por sabido qué es una API, TMDB o «vanilla JS».
  Explícalo en llano, con lo que cuesta y la alternativa, sin condescendencia.
- **Pide sugerencias de mejora.** Espera una lista priorizada, no un catálogo.
- **Añade requisitos sobre la marcha.** Las listas de favoritas/pendientes llegaron después
  de aprobar el plan. Incorpóralos y actualiza el plan, no los rechaces.

---

## 4. Arquitectura

Un solo archivo, `index.html` (~2.400 líneas), partido en bloques con banners de comentario.
Cada banner nombra el archivo al que iría si se fracciona. **Mantén esa correspondencia.**

### CSS — dentro de `<style>`

| Bloque | Destino | Contenido |
|---|---|---|
| 1 | `css/base.css` | Reset, body, scrollbar, foco, utilidades |
| 2 | `css/header.css` | Cabecera, marca, pastilla de modo, contador |
| 3 | `css/buscador.css` | Pestañas, campo, autocompletado, filtros, chips |
| 4 | `css/resultados.css` | Resumen, ficha, países, rejilla, persona, esqueletos |
| 5 | `css/modales.css` | Capas, modales, avisos flotantes, pie |
| 6 | `css/responsive.css` | 860 px, 620 px, `prefers-reduced-motion` |

### JavaScript — dentro de `<script>`

Todo cuelga del objeto global `GMM`, de modo que **separar los bloques en archivos no exige
tocar ni una línea**: basta con enlazarlos en este orden.

| Bloque | Destino | Responsabilidad |
|---|---|---|
| 1 | `js/config.js` | `GMM.config` — constantes, claves de `localStorage`, ofertas, idiomas |
| 2 | `js/datos.js` | `GMM.datos` — mapa país→idiomas, grupos, plataformas, alias |
| 3 | `js/demo.js` | `GMM.demo` — catálogo de ejemplo sin clave |
| 4 | `js/util.js` | `GMM.util` — escapado, normalizar, enumerar, retardo, lotes |
| 5 | `js/tmdb.js` | `GMM.tmdb` — peticiones, caché, conmutación demo/vivo |
| 5b | `js/omdb.js` | `GMM.omdb` — **fuente secundaria opcional**: notas de IMDb/RT/Metacritic por `imdb_id` |
| 6 | `js/idioma.js` | `GMM.idioma` — **el núcleo**: evaluar, filtrar, frase |
| 7 | `js/listas.js` | `GMM.listas` — favoritas y pendientes |
| 8 | `js/ui.js` | `GMM.ui` — pintado de componentes, avisos |
| 9 | `js/app.js` | `GMM.app` — estado, vistas, eventos, arranque |
| 10 | `js/pwa.js` | `GMM.pwa` — service worker y botón de instalar |

### Aplicación instalable (PWA)

| Archivo | Para qué |
|---|---|
| `manifest.json` | Nombre, iconos, colores y `display: standalone`. **Rutas relativas** (`./`): en GitHub Pages el sitio cuelga de `/givemymovies/`, no de la raíz |
| `sw.js` | Service worker: instalable y utilizable sin conexión |
| `iconos/` | `icono.svg` (origen), los PNG generados y `generar.js` para rehacerlos |

**Estrategia de caché del service worker**, y el porqué:

| Recurso | Estrategia | Razón |
|---|---|---|
| `api.themoviedb.org` | **Solo red, nunca caché** | La disponibilidad cambia. Servirla rancia convertiría la app en un engaño |
| `image.tmdb.org` | Caché primero, tope de 300 | Una carátula no cambia nunca para una misma URL |
| Abrir la app | Red primero, caché de reserva | Las versiones nuevas llegan solas; sin conexión sigue abriendo |
| Iconos y manifiesto | Caché primero | No cambian entre versiones |

**Al publicar una versión que toque el código, sube `VERSION` en `sw.js`.** Si no, quien ya
tenga la app cacheada seguirá viendo la vieja. Es el mismo problema del `CACHE_NAME` de Foresee.

**Solo funciona sobre HTTPS.** Al abrir el archivo con doble clic la app va igual de bien,
simplemente no se instala ni cachea: `GMM.pwa.seguro()` lo detecta y no registra nada.

### Estado

`GMM.app` guarda un único objeto `estado`. Los que mandan en la búsqueda: `tipo`
(`movie`/`tv`, el interruptor), `metodo` (`buscar`/`descubrir`) y `busquedaPor`
(`titulo`/`actor`/`trama`, el desplegable). Más `plataforma`, `pais`, `idioma`,
`mostrarTodos`, `vista`, `pelicula`, `proveedores`, `persona`, `filmografia`,
`disponibilidad`, `ctxPagina` (paginación) y —para Descubrir— `genero`, `anoDesde`,
`anoHasta`, `notaMin`, `orden` (`popular`/`reciente`/`antigua`), `porNota`, y el par
`anios`/`recorrido` del recorrido año por año. **Ya no hay `categoria`**: desde la 0023 los cinco
carruseles están a la vista y no hay «categoría activa» que recordar.
`reflejar()` vuelca el formulario (interruptor, método, título del modal, marcador, chips,
acentos, orden).

**El interruptor peli/serie vive en la barra bajo el header** (desde V GMM 0020), a la izquierda
junto a *Mis listas* (antes estaba dentro del buscador). La barra tiene dos grupos: `.barra-izq`
(Mis listas + interruptor) y `.barra-der` (Instalar + ⚙). Sigue teniendo id `#tipoSwitch`, así que
`reflejar()` y sus acentos (`#buscador[data-tipo]`, `#descubrimiento[data-tipo]`) funcionan igual.
**La app arranca sin método elegido** (`estado.metodo = ""`; desde V GMM 0021, antes era «buscar»),
y el método no se restaura de `gmm_prefs`: cada recarga vuelve a ese arranque limpio. **El botón ⚙
es un círculo compacto** pegado a la derecha de la barra (`#btnAjustes`, 34 px, el engranaje sin
reducir).

### El modal-formulario (desde V GMM 0022)

**Los controles de los dos métodos no están en la página: viven en un modal.** En el inicio solo
quedan el título y **dos botones del mismo tamaño** (`.metodos`, rejilla de dos columnas iguales,
no flex: así miden lo mismo aunque sus textos no); cada uno abre `#capaFormulario` con sus campos.

**Es un solo modal para los dos métodos, no dos.** Dentro están los mismos nodos de siempre
—`#panelBuscar`, `#descubrir`, `#filtros`, `#chips`— y `reflejar()` decide cuáles se ven, igual
que cuando estaban en la página. Hacerlo con dos modales habría duplicado `#selIdioma`,
`#selGenero` y compañía, con ids repetidos y dos copias de estado que sincronizar.

**El cuerpo es UNA rejilla de dos columnas** (`.forma`) y los bloques interiores son
`display: contents`, de modo que sus campos entran directos en esa rejilla y se reparten **de dos
en dos aunque vengan de bloques distintos**. Los grandes ocupan fila entera (el campo de texto, la
fila de orden, los chips). Detalles que hay que conservar:

- El empaquetado es **`grid-auto-flow: row dense`** a propósito: con el campo de texto a fila
  completa quedaría un hueco a su lado, y así lo rellena el filtro siguiente.
- `.oculto` **hay que repetirlo** para esos bloques (`.forma .panel-buscar.oculto`, …): el
  selector de `display: contents` es más específico y, sin ello, un bloque oculto seguiría
  enseñando sus campos.
- En Descubrir los campos son impares y «País» cerraría media fila: se estira a fila completa.
- **El autocompletado no puede flotar dentro del modal** (`position: static`): el cuerpo hace
  scroll y lo recortaría. Se muestra en el flujo, empujando lo que venga debajo.
- El botón **Buscar vive en el pie**, centrado (`.modal-pie.centrado`), y toma el color del tipo;
  por eso `#capaFormulario` lleva también `data-tipo`, no solo `#buscador`.

**Con el modal abierto, la barra queda detrás del velo.** Consecuencias asumidas: el interruptor
peli/serie se cambia cerrando el modal (sigue en su barra, como decidió la 0020), y para que no se
pierda de vista qué se busca, **el título del modal nombra el tipo** («Buscar una serie en
concreto», «Descubrir películas por género»). Para pasar de un método al otro sin cerrar hay un
enlace en el propio modal (`#btnCambiarMetodo`), porque cerrar y reabrir sería un camino absurdo
para algo tan corriente.

**Escape cierra el modal, salvo si el autocompletado está desplegado**, en cuyo caso cierra solo
el desplegable. Lo resuelve el manejador de `#entrada` con `stopPropagation()`, no el del
documento: el del campo corre antes, y sin cortar la propagación el modal se cerraba también y se
perdía lo escrito.

**El modal de sugerencias se retiró en la 0023.** Existía para elegir cuál de las cinco categorías
se veía en el único carrusel; con los cinco a la vista ya no elegía nada.

**Dos pantallas (desde V GMM 0009):** la de búsqueda (formulario visible) y la de resultados
(formulario **oculto**, con una flecha **←** para volver). Lo alterna `fijarPantalla()` según
`estado.vista` (`inicio` = búsqueda; cualquier otra = resultados). Los filtros de idioma,
plataforma y país se eligen **antes** de buscar: al haber resultados no están a la vista, así
que ya no se refinan en vivo (se cambia con ← y buscar de nuevo). El estado de datos es un
**punto** en el header (verde = en vivo, naranja = demo) y **Mis listas** vive en una barra bajo
el header, no dentro.

**El orden sí se cambia sobre los resultados** (desde V GMM 0022): junto a la flecha ←, en su
misma fila, un desplegable `#ordenMenu` con los tres interruptores. Es la **única** excepción a lo
anterior, y no la contradice: reordenar no es refinar en memoria, exige otra consulta, y volver al
formulario para algo tan corriente era el paso de más que se quería quitar.

**Los tres interruptores de orden existen por duplicado** —el del formulario (`#orden`) y el del
desplegable (`#ordenPanel`)— y por eso `reflejarOrden()` **casa por atributo `[data-orden]`, no
por id**: así las dos copias dicen siempre lo mismo sin sincronizarlas a mano, y un solo manejador
(`alPulsarOrden`) sirve a ambas. **Cuidado al contar en las pruebas:** `.orden-op.activa` a secas
cuenta el doble; hay que acotar a `#orden`.

**`disponibilidad` se indexa por `"tipo:id"`, no por id a secas.** Una película y una serie
pueden compartir id numérico en TMDB, y la lista de pendientes ya puede mezclar ambas: usar
solo el id haría que una pisara a la otra. Lo mismo vale para las listas (`GMM.listas` casa
por id **y** tipo).

**Cambiar un filtro no vuelve a llamar a la API**: `repintarVista()` recalcula sobre los
datos ya en memoria. Mantén esa propiedad, es lo que hace la app ágil.

### El recorrido año por año (desde V GMM 0015)

Ordenar **por fecha y por nota a la vez** no cabe en una consulta de TMDB: `sort_by` admite
**una sola clave**. Cuando están encendidos «más recientes» (o «más antiguas») **y** «mayor
puntuación», la lista se arma visitando los años uno a uno y pidiéndole a cada año su propia
lista ordenada por nota. Da exactamente lo pedido —2026 primero, y dentro de 2026 las mejor
puntuadas— y **sigue costando una petición por página**, porque los años se piden según se
avanza, nunca de golpe.

Lo llevan `esPorAnios()`, `aniosDelIntervalo()`, `buscarDesdeAnio()` y `cargarAnio()`, con
`estado.recorrido` como lista de cursores ya vistos (`{ iAnio, ano, pag, total }`).

**Consecuencia visible: el paginador cambia.** No hay total global que mostrar, así que en vez
de «Página 3 de 40» dice **«2026 · página 3 de 5»**, y al agotar un año salta al siguiente con
resultados, saltándose los vacíos. Por eso `paginadorHtml()` recibe un objeto y acepta
`etiqueta`, `hayPrev` y `hayNext` además del clásico `pagina`/`total`.

`MAX_ANOS_VACIOS` (25) corta el recorrido si se encadenan demasiados años sin nada, para no
disparar una ráfaga de peticiones inútiles. **Sin clave no se aplica**: el catálogo de ejemplo
se filtra en memoria y ahí no hay peticiones que ahorrar.

**Este recorrido ya no se activa solo.** Entre la 0019 y la 0021, «Ver más» encendía fecha + nota
a la vez y `estado.topAnio` cortaba cada año a 10, de donde salía el paginador «2000 · 10 mejores».
**Eso se retiró en la V GMM 0022** (`topAnio` ya no existe): el recorrido año por año sigue intacto,
pero **solo cuando el usuario pide expresamente esa combinación**. Ver §4 «El modal-formulario» y
la entrada de la 0022 en el historial.

### Las notas de IMDb / RT / Metacritic (desde V GMM 0016)

TMDB solo da **su propia** nota (0–10). Las de **IMDb, Rotten Tomatoes y Metacritic** vienen
de **OMDb**, una segunda API gratuita (1.000 consultas/día) con **su propia clave opcional**.
Es un **enriquecimiento**, no una dependencia: sin clave de OMDb la app funciona exactamente
igual, solo que la ficha no muestra esas notas.

- Vive en `GMM.omdb` (bloque JS 5b). `parsear(json)` convierte la respuesta cruda en
  `{ imdb, rt, meta }` tolerando `"N/A"` y `Response:"False"`; **está aislada a propósito**
  para poder probarla sin red. `notas(imdbId)` **nunca lanza**: cualquier fallo → `null`.
- El puente es el **`imdb_id`**: las películas lo traen suelto; las series solo si se pide
  `append_to_response=…,external_ids`, y `normalizarMedia` lo sube al nivel de la ficha.
- **Solo se pide en la ficha y en el modal de detalle** (un título cada vez), nunca en las
  cuadrículas de Descubrir/Trama **ni en los carruseles del inicio**: serían decenas o cientos de
  peticiones y reventaría el tope diario. Los carruseles lo usaron entre la 0017 y la 0022; ver
  «Los cinco carruseles del inicio».
- Llega **después** de pintar la ficha y **repinta** (barato, sin volver a la API). La clave
  se guarda en ⚙, junto a la de TMDB.

### Los cinco carruseles del inicio (desde V GMM 0017; cinco desde la 0023)

Viven en una sección propia `#descubrimiento`, **bajo el header y encima del buscador**, y —como
el buscador— solo existen en el inicio: `fijarPantalla()` los oculta al haber resultados.

**Hay uno por categoría y se ven los cinco a la vez.** Los monta `montarCarruseles()` a partir de
`GMM.config.CATEGORIAS_SUGERENCIA`: añadir una categoría al config añade su carrusel, sin tocar
el HTML. Cada bloque es autónomo —su pista es `#carrusel-{clave}`, se carga por su cuenta y su
«Ver más» mira su propia categoría—, y se cargan **en paralelo**, cada uno pintando en cuanto
llega. Hasta la 0022 había uno solo y un modal elegía cuál se veía.

**Se ordenan por la nota de TMDB, y esa misma nota es la que luce cada tarjeta.** `GMM.ui.tarjeta`
pinta la insignia `.tarjeta-nota` **solo si el ítem trae `tmdbNota`** (lo marca `conNota()` en
`GMM.app`), así que las cuadrículas de Descubrir —que traen `vote_average` igual— no la llevan.
`GMM.util.mejoresPorNota` (pura y testable) filtra por `NOTA_MIN_CATEGORIA` (6), ordena y corta a
`TOP_CATEGORIA` (20), que es justo lo que cabe en una página de `/discover`: **una sola petición
por carrusel**.

**Hasta la 0022 el «top 10» se rankeaba por la nota REAL de IMDb**, dando un rodeo por OMDb
(`imdb_id` de cada candidato vía `GMM.tmdb.ficha` + su nota vía `GMM.omdb.notas`). Con cinco
carruseles de veinte cargando a la vez eso son **~120 consultas a OMDb por visita**, sobre un tope
de 1.000 al día: se agotaría en ocho aperturas de la app. Además la lista iría ordenada por un
número distinto del que muestra la insignia. **OMDb sigue donde no cuesta: en la ficha.**

Todo cacheado en memoria por `tipo:categoria`, así que ir y volver del inicio —o cambiar el
interruptor de ida y vuelta— no repite peticiones. **`alternarLista` invalida la caché de
`favoritas`** y repinta ese carrusel: «Lo que prefieres» está siempre a la vista y marcar una
favorita tiene que notarse ahí mismo.

**Tocar una tarjeta abre la ficha completa** (`abrirFicha`, la misma vista que buscar por título),
no el modal de detalle de las cuadrículas. La delegación de clic de `#resultados` **no** alcanza
aquí (esto vive en `#descubrimiento`, otra sección), así que hay **una sola delegación en
`#descubrimiento`** que sirve a los cinco bloques: `[data-mover]` → `desplazarCarrusel`,
`[data-vermas]` → `verMasCategoria`, `[data-abrir]` → `abrirFicha`, `[data-lista]` →
`alternarLista`. Es delegación y no un listener por flecha porque las pistas **se repintan
enteras** en cada carga, y habría que recablear cada vez. Desde V GMM 0018 (el clic) y 0023 (la
delegación única).

**Cada carrusel es "infinito" con sus flechas** (desde V GMM 0019): `desplazarCarrusel(clave, dir)`
detecta el borde y da la vuelta —› en el final salta al principio, ‹ en el principio salta al
final—; no clona tarjetas, solo hace `scrollTo`.

**«Ver más» en las categorías con intervalo** (de siempre / nunca es tarde / clásicos; desde V GMM
0019, replanteado en la 0022 y uno por carrusel desde la 0023): el botón `[data-vermas]` —solo en
los bloques cuya categoría tiene `anoDesde`— abre la **cuadrícula corriente de Descubrir** sobre el
intervalo de esa categoría, del año más antiguo al más reciente y con **nota de TMDB ≥ 6**.
`verMasCategoria(clave)` preajusta el estado (género = todos, intervalo de la categoría,
`notaMin` = 6, orden = *antigua*) y **deja `porNota` apagado**.

**Ese `porNota: false` es el punto entero del arreglo.** Con un solo criterio de orden la lista
pagina de corrido: **20 por página y «Página 1 de N»**. Encenderlo también —como hacía hasta la
0021— es exactamente lo que dispara el recorrido año por año, y con él el paginador «2000 · 10
mejores» que el usuario rechazó. Si algún día se toca `verMasCategoria`, **no vuelvas a encender
`porNota` ahí**: no es un detalle, es el comportamiento que se pidió.

### Persistencia (`localStorage`)

| Clave | Contenido |
|---|---|
| `gmm_tmdb_key` | Clave de la API de TMDB |
| `gmm_omdb_key` | Clave de la API de OMDb (opcional; notas de IMDb/RT/Metacritic) |
| `gmm_prefs` | Modo, plataforma, país, idioma y los criterios de Descubrir (género, intervalo de años, nota, orden) |
| `gmm_listas` | `{ favoritas: [], pendientes: [] }` |

---

## 5. Paleta

Valores literales, repetidos donde haga falta. **No los conviertas en variables CSS.**

```
Fondo profundo   #0b0f14      Verde    #2ee6a8   disponible, suscripción, confianza alta
Superficie       #131c26      Naranja  #ff8a3d   alquiler, compra, avisos, opcional
Superficie alta  #1a2632      Azul     #4aa8ff   info, anuncios, enlaces, pendientes
Bordes           #22303e      Texto    #e8f0f8   apagado #8ba0b6   tenue #5e768c
Borde claro      #2f4356      Verde ✓  #6ff0c4   Azul ✓ #8fc9ff    Naranja ✓ #ffb37d
```

Degradados que mezclan los tres en: marca, botón *Buscar*, pestaña activa, barra de progreso.

---

## 6. Datos: TMDB

Clave gratuita que el usuario pega en ⚙ y se guarda en su navegador. Sin clave, **modo demo**
con ocho películas de ejemplo, para que la app nunca aparezca vacía.

| Uso | Endpoint |
|---|---|
| Buscar título | `/search/movie` · `/search/tv` (según el interruptor) |
| Buscar persona | `/search/person` |
| Filmografía | `/person/{id}/movie_credits` · `/person/{id}/tv_credits` |
| Ficha película / serie | `/movie/{id}` · `/tv/{id}` (con `append_to_response=alternative_titles`) |
| Títulos alternativos por país | dentro de la ficha (`alternative_titles`); se filtran a mercados en español + inglés en `GMM.util.titulosAlternativos` |
| **Dónde verla** | `/movie/{id}/watch/providers` · `/tv/{id}/watch/providers` ← el dato central |
| Trama | `/search/keyword` → `/discover/movie?with_keywords=` · `/discover/tv?with_keywords=` |
| **Descubrir por género** | `/discover/movie` · `/discover/tv` con `with_genres`, `vote_average.gte`, `sort_by`, y el intervalo por `primary_release_date.gte/.lte` (o `first_air_date.*`). El recorrido año por año usa además `primary_release_year` / `first_air_date_year` |
| **Tendencia** (carrusel del inicio) | `/trending/movie/week` · `/trending/tv/week` |
| Catálogo de plataformas | `/watch/providers/movie` |

### Datos: OMDb (secundaria, opcional)

| Uso | Endpoint |
|---|---|
| **Notas IMDb / RT / Metacritic** | `https://www.omdbapi.com/?apikey=…&i={imdb_id}` ← se cruza por el `imdb_id` de TMDB |

Clave gratuita y aparte de la de TMDB (1.000 consultas/día). Se pide en
<https://www.omdbapi.com/apikey.aspx> (plan FREE!) y hay que **activarla** desde el correo.
Sin ella, la app no muestra esas notas pero funciona igual.

Los géneros **no** se piden a la API: son una taxonomía estable, viven en
`GMM.datos.GENEROS_PELICULA` y `GMM.datos.GENEROS_SERIE`. Ahorra una llamada y funciona igual
en demo que en vivo.

Errores tratados por nombre: `CLAVE_INVALIDA` (401), `DEMASIADAS_PETICIONES` (429).

### Al tocar el catálogo de demo, verifica las imágenes

Ya pasó dos veces: el id `1417` **no** es *Volver* (es *El laberinto del fauno*; el correcto
es **219**) y el `1281` **no** es Penélope Cruz (es Freddie Highmore; el correcto es **955**).

Un HTTP 200 en `image.tmdb.org` **no** prueba que la imagen sea de esa película. Comprueba
siempre la etiqueta `og:title` de `themoviedb.org/movie/{id}?language=es-ES` y saca de ahí
el `og:image`. Y no cojas el primer `<img>` de la página: suele ser un recomendado.

---

## 7. Cómo se verifica

**La aplicación no tiene dependencias.** `pruebas/` es una herramienta aparte y opcional.

```bash
node pruebas/logica.js      # 125 comprobaciones · sin dependencias · instantáneo
node pruebas/imagenes.js    #  15 comprobaciones · necesita internet · ~30 s
node pruebas/interfaz.js    # 109 comprobaciones · playwright-core · ~60 s
node pruebas/pwa.js         #  20 comprobaciones · playwright-core · ~20 s
```

Última ejecución: **269 comprobaciones, todas correctas**, sin errores de JavaScript en
consola. Las cuatro suites, en local, el 2026-07-30 sobre la 0023.

> **Las versiones 0016 a 0021 se cerraron en un entorno remoto sin acceso a npm**, así que
> `interfaz.js` y `pwa.js` (que dependen de `playwright-core`) no se ejecutaron allí: solo
> corrió `logica.js`. Al pasarlas en local sobre la 0021 **fallaban las dos**, y no por un
> fallo de la app: **los tests se habían quedado atrás**. Los métodos plegados de la 0021
> dejan `#entrada`, `#selBusquedaPor` y `#filtros` ocultos al arrancar y tras cada recarga,
> y Playwright no escribe en lo invisible. Arreglado con un ayudante `abrirMetodo(cual)` en
> `interfaz.js` —que pulsa el botón del método solo si su panel no está ya a la vista, porque
> el clic vacía el campo— y un clic equivalente en `pwa.js`. De paso, 6 comprobaciones nuevas
> (72→78) que fijan el comportamiento de la 0021: ningún método activo al arrancar, los tres
> paneles plegados, y que la recarga los devuelve plegados (desde la 0020 el método no se
> restaura de prefs).
>
> **Lección: cuenta las tarjetas acotando el selector.** «hay 2 tarjetas» usaba
> `.tarjeta` a secas y desde la 0017 el carrusel del inicio pinta las suyas con la misma
> clase y **las deja en el DOM, solo ocultas**, en las demás vistas. Ahora es
> `#resultados .tarjeta`. Cualquier recuento nuevo debe acotarse al contenedor.
>
> **Lección (0023): una caché puede tragarse tu simulacro.** La comprobación de que cada
> carrusel corta en 20 títulos inyectaba una respuesta de 30 y cambiaba el interruptor para
> forzar la recarga… pero los carruseles se cachean por `tipo:categoria` y a esas alturas de
> la sesión ya estaban todos cacheados, así que el simulacro **no llegaba a pedirse** y el
> test veía las 3 series de la demo. Se resolvió abriendo una **pestaña aparte** con un
> `addInitScript` que instala el simulacro en `DOMContentLoaded`: ese manejador se registra
> antes que el de `GMM.app.iniciar` y corre con `GMM` ya definido. Antes de inyectar una
> respuesta, pregúntate si algo la tiene ya guardada.

Detalle en `pruebas/LEEME.md`. `logica.js` cubre la normalización de series, Descubrir sobre
la demo, las listas conscientes del tipo, la búsqueda de series (título y trama), —desde la
0015— el intervalo de años y las combinaciones de orden, y —desde la 0016— el parseo de las
notas de OMDb (`GMM.omdb.parsear`: respuesta completa, `Response:"False"`, campos ausentes,
`"N/A"` y el `Metascore` de reserva), y —desde la 0023— el selector de los carruseles
`GMM.util.mejoresPorNota` (filtra nota ≥ 6, ordena, corta, ignora sin nota, admite otro umbral)
y la forma del config de categorías. `interfaz.js` recorre el interruptor
peli/serie, la búsqueda de una serie por título, Descubrir con series, los interruptores de
orden con su paginador por años, —desde la 0021— los métodos plegados, —desde la 0022— el modal
del formulario (abrir, cerrar con la X), que los dos métodos **midan lo mismo**, que
**«Ver más» diga «Página 1 de 30» con 20 carátulas** y sin etiqueta de año, el desplegable de
orden junto a ← con sus dos copias sincronizadas, y que en el móvil el modal **deje margen y no
ocupe toda la altura**; y —desde la 0023— los **cinco carruseles** (cinco bloques, sus ids de
pista, sus títulos, «Ver más» solo en los tres con intervalo, que el botón y el modal de
sugerencias ya no existan, la insignia de **nota de TMDB** y no la de IMDb, y el corte en 20).

`pwa.js` levanta un servidor local, porque los service workers no funcionan sobre `file://`
y `localhost` cuenta como origen seguro igual que HTTPS.

Verificado además **con datos reales** (17 comprobaciones aparte, no versionadas): 130 países
y 799 plataformas para *Interstellar*, 19 tras filtrar por español; filmografía de Penélope
Cruz con 98 títulos. La app aguanta el volumen real sin degradarse.

**Los umbrales de voto están medidos, no supuestos** (V GMM 0015). Contra la API real, el
drama mejor puntuado con `vote_count.gte=100` era un desconocido con 9,9 de 143 votos; con
300 salen *Cadena perpetua*, *El padrino* y *La lista de Schindler*. Subir de 300 no cambia
la cabeza de la lista y sí adelgaza los años antiguos, que es justo lo que recorre el orden
por año y nota: con 300 votos, 1975 conserva 13 dramas y 1960, 15. De ahí `VOTOS_MIN_NOTA`.
**Si cambias ese número, vuelve a medirlo**; no lo ajustes a ojo.

- **Toca `GMM.demo`** → obligatorio `pruebas/imagenes.js` (ver §6).
- **Toca CSS o el DOM** → obligatorio `pruebas/interfaz.js` y mirar `pruebas/capturas/`.
- **Toca `sw.js`, `manifest.json` o `iconos/`** → obligatorio `pruebas/pwa.js`.
- **Cualquier cambio de JS** → `pruebas/logica.js` como mínimo.

Comprobación manual rápida, si no quieres ejecutar nada:

- `Interestelar` + español, sin filtros → 6 países, frase con Netflix y Max.
- Añadir plataforma `Netflix` → se reduce a Argentina, Chile y México.
- Cambiar idioma a `árabe` → aviso de que está en 10 países pero ninguno lo sirve.
- 375 px de ancho → sin desbordamiento horizontal.

---

## 8. Límites conocidos (no son fallos)

- **Precios** de alquiler y compra: TMDB no los publica; requiere la API de pago de JustWatch.
- **Búsqueda por trama**: TMDB no busca dentro de la sinopsis. Se usan palabras clave, que
  funcionan con conceptos pero no con frases largas.
- **Series en las cuatro búsquedas** (desde V GMM 0006): el interruptor peli/serie manda en
  título, actor, trama y Descubrir. Antes (V GMM 0005) las series solo entraban por Descubrir.
- **Puntuaciones de otras plataformas** (IMDb, Rotten Tomatoes, Metacritic): **integradas en
  V GMM 0016** vía OMDb (`GMM.omdb`), con su segunda clave **opcional**. Aparecen en la ficha
  y en el modal de detalle, no en las cuadrículas ni en los carruseles. La calificación de
  Descubrir y la insignia de los carruseles son la propia de TMDB (0–10).
- **Filmografías**: se consultan los 24 títulos más populares, con 5 peticiones simultáneas.
- **La clave viaja al navegador**: para publicar en internet haría falta un servidor intermedio.

---

## 9. Trampas ya pisadas

| Trampa | Qué pasó |
|---|---|
| Autocompletado reabriéndose | La petición retardada pendiente se disparaba *después* de buscar y tapaba los filtros. `GMM.util.retardo` expone `.cancelar()` y `cerrarSugerencias()` lo llama. No lo quites. |
| Desplegable sobre el botón | Tapaba *Buscar*. Se cierra también al perder el foco, con 160 ms de margen para que el clic en una sugerencia llegue a registrarse. |
| Tarjetas de país estiradas | El grid las igualaba a la más alta de la fila y dejaba huecos. `align-items: start` en `.paises`. |
| Acentos en expresión regular | Las marcas diacríticas sueltas en el código son frágiles ante cambios de codificación. Usar la forma escapada `[\u0300-\u036f]`, como en `GMM.util.normalizar`. |
| **Editar archivos con PowerShell** | `Get-Content` + `Set-Content -Encoding utf8` **destroza los acentos**: en PowerShell 5.1 la lectura asume ANSI y la escritura vuelca UTF-8, duplicando cada carácter (`película` → `pelÃ­cula`). Ya pasó con `index.html` y `sw.js`. **Usa siempre la herramienta Edit**, o `[System.IO.File]::ReadAllText/WriteAllText` con `UTF8Encoding($false)`. |
| Dos bloques `<script>` | `pruebas/cargar.js` busca el de la app con `lastIndexOf`, no con `indexOf`: hay un `<script>` anterior —el cargador de la clave local— y empezar por el primero arrastraría el HTML intermedio. El de la app es siempre el último. |
| Modal sin scroll | Un modal sin `max-height` desborda la pantalla en móvil y el final queda inaccesible. La ficha de detalle limita el modal a la altura de la pantalla y hace scroll en el **cuerpo** (`.modal` en `flex` columna + `.modal-cuerpo` con `min-height: 0; overflow-y: auto`), no en la capa. Cualquier modal nuevo que crezca debe seguir el mismo patrón. |
| **Un solo `sort_by` por consulta** | TMDB no ordena por dos criterios. «Año y luego nota» **no** se resuelve reordenando la página ya traída: los 20 títulos de la página son solo los 20 primeros según *un* criterio, y reordenarlos por otro da una lista que parece lo pedido sin serlo —los mejores del año pueden estar en la página 8—. Por eso se recorre año por año. Si algún día se añade otro orden combinado, mismo camino. |
| Estrenos futuros en `/discover` | Ordenar por fecha descendente llena la primera página de películas **sin estrenar**, que es lo contrario de lo que responde la app. Todas las consultas de Descubrir cortan en la fecha de hoy (`primary_release_date.lte` / `first_air_date.lte`). |
| Carátulas de la demo que caducan | TMDB cambia la carátula principal de un título con el tiempo, y `pruebas/imagenes.js` compara contra la oficial del momento. Tres series fallaron sin que nadie tocara el código. **No es una imagen rota: es que se movió.** Se arregla copiando el `poster_path` que el propio test reporta como oficial. |
| **`display: contents` gana a `.oculto`** | En el modal-formulario los bloques son `display: contents` para que sus campos entren en la rejilla común. Ese selector es **más específico** que `.oculto`, así que un bloque «oculto» seguía enseñando sus campos. Hay que repetir el ocultado (`.forma .panel-buscar.oculto { display: none }`). Vale para cualquier bloque nuevo que se sume a `.forma`. |
| **Escape encadenado en un modal** | Con el autocompletado desplegado dentro del modal, Escape lo cerraba **y además** cerraba el modal, perdiendo lo escrito: el manejador de `#entrada` corre antes que el del documento, y este veía la lista ya cerrada. Se corta con `stopPropagation()` en el del campo. Cualquier capa nueva que anide controles con Escape propio tiene el mismo riesgo. |
| **Un control duplicado se cuenta dos veces** | Los interruptores de orden viven en el formulario **y** en el desplegable de la barra. `reflejarOrden()` casa por `[data-orden]` (bien), pero las pruebas contaban `.orden-op.activa` a secas y sacaban el doble. Acota al contenedor: `#orden .orden-op.activa`. Es la misma lección que las tarjetas del carrusel. |
| **Lo que el modal deja detrás del velo** | Al mudar el formulario a un modal, todo lo que queda fuera —la barra con el interruptor peli/serie y los dos botones de método— **deja de ser pulsable** mientras esté abierto. No es un fallo de CSS: es lo que hace un modal. Se resolvió nombrando el tipo en el título y añadiendo un enlace para cambiar de método sin cerrar. Antes de mover algo a un modal, mira qué se queda fuera. |

---

## 10. Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa. Versión en el pie, en `#version-app` |
| `README.md` | Manual de usuario: clave de TMDB, modos, guía de fraccionamiento |
| `CLAUDE.md` | Este archivo |
| `PROMPT-MAESTRO.md` | Prompt que reconstruye el proyecto entero. **Actualízalo con cada cambio.** |
| `pruebas/` | Herramienta de verificación, opcional y con dependencias propias |
| `.gitignore` | Excluye `node_modules`, capturas y **`PRIVADO/`** |
| `PRIVADO/` | **Solo local, jamás versionado.** Credenciales y clave de TMDB |
| `respaldos/` | **Versionado en git.** Copia de la app completa por versión, hecha antes de modificarla, como red de seguridad. Ver `respaldos/LEEME.md` |

**Nunca escribas secretos fuera de `PRIVADO/`.** El repositorio es público y git conserva
para siempre lo que se commitea, aunque después se borre. Si añades otro archivo con datos
sensibles, comprueba antes que está excluido: `git check-ignore -v ruta/al/archivo`.

**Git:** rama `main`, remoto `origin` → <https://github.com/Alberthoma/givemymovies>
(**repositorio público**). Identidad fijada **solo en este repo**
(`Alberthoma <albertomatosgil@gmail.com>`), porque la global es un correo de relleno —
al hacer `git config` en este proyecto, usa siempre el ámbito local, nunca `--global`.

GitHub Pages **no está activado**. Si se activa, la app quedaría accesible por URL, pero
la clave de TMDB de quien la use seguiría viviendo en su propio navegador: cada visitante
tendría que poner la suya, o haría falta el servidor intermedio de §8.

**Clave de TMDB:** para comprobar que una clave funciona sin exponerla en una conversación,
`node pruebas/clave.js TU_CLAVE`. La app usa la **API Key (v3 auth)**, 32 caracteres
hexadecimales — no el *Read Access Token*, que empieza por `eyJ` y no sirve aquí.

---

## 11. PENDIENTES

Dos temas abiertos, ninguno urgente. **No los abordes por iniciativa propia**: están aquí
para que la decisión esté preparada cuando el usuario los retome.

### 11.1 — La clave de TMDB en el móvil

**Planteado el 28-07-2026. Sin resolver.**

El usuario quiere abrir la app desde su móvil. Para eso hay que publicarla (GitHub Pages o
similar), y de ahí su pregunta: si la clave no se sube al repositorio, ¿cómo funciona allí?

### Aclaración que cambia el problema

**La clave no necesita viajar en el repositorio.** La app la lee del `localStorage` del
navegador donde se abre, no del código. Publicar el código y pegar la clave una vez en el ⚙
del móvil basta: ese dispositivo la recuerda indefinidamente.

`PRIVADO/clave-local.js` es solo un atajo para el PC del usuario; no es el mecanismo.

### Dato que hay que tener presente antes de decidir

**Un repositorio privado NO da una web privada.** GitHub Pages publica el sitio de forma
abierta aunque el repositorio sea privado; el control de acceso solo existe en Enterprise.
Y publicar Pages desde un repositorio privado exige plan de pago. Conviene confirmar las
condiciones vigentes antes de apostar por esa vía.

### Opciones, de menos a más esfuerzo

| Opción | Cómo funciona | Coste | Riesgo de la clave |
|---|---|---|---|
| **A · Pegarla en el móvil** *(recomendada)* | Publicar solo el código. Una vez en el ⚙ del móvil y listo | Cero. Ya está implementado | Ninguno |
| **B · Clave en el código + Pages** | Hardcodear la clave y publicar | Cero | **Expuesta a todo internet**, y en el historial de git para siempre |
| **C · Proxy propio** | Función serverless (Cloudflare Workers, Vercel, Netlify) que guarda la clave y reenvía a TMDB. La app llama al proxy | Un servicio más que mantener; hay planes gratuitos | Ninguno: la clave nunca llega al navegador |
| **D · Publicar fuera de git** | Netlify Drop o variable de entorno inyectada al desplegar | Bajo | Bajo, según el proveedor |

**A resuelve el caso de uso real** —una persona, unos pocos dispositivos— sin infraestructura.
**C es la respuesta correcta** si algún día la usa alguien más que él, porque cada visitante
necesitaría su propia clave con la opción A.

**No implementar B.** Si el usuario insiste, avisar de que la clave queda pública y de que
habría que regenerarla al retirarla.

---

### 11.2 — Login y sincronización de las listas entre dispositivos

**Planteado el 28-07-2026. Sin resolver.** El usuario apunta a Firebase.

**El problema real.** `gmm_listas` vive en `localStorage`, que es **por navegador y por
dispositivo**. Lo que guarde en el móvil no aparece en el PC ni al revés: son dos listas
distintas con el mismo nombre. Además, borrar los datos del sitio se las lleva. Hoy el único
puente es exportar e importar el JSON a mano desde ⚙.

**Lo que haría falta**, en orden:

1. **Login.** El propio usuario lo dedujo, y es correcto: sin saber quién es, no hay «mis
   listas» — el servidor no sabría de quién son. Es el primer paso, no un extra.
   - **Recomendado: acceso con Google.** En un móvil es un toque, sin contraseña que
     recordar ni que custodiar. Firebase Auth lo da hecho.
   - *Acceso anónimo* de Firebase: cero fricción, pero la identidad muere si borra los datos
     del navegador, que es justo el problema que se quiere resolver. **No sirve solo.**
   - *Correo y contraseña*: implica gestionar recuperación de contraseña y almacenar
     credenciales. Más trabajo y más responsabilidad, sin ventaja aquí.
   - Impacto en la interfaz: un botón de acceso en la cabecera y el aviso de que, sin
     identificarse, las listas siguen siendo solo de ese dispositivo. **La app debe seguir
     funcionando sin login**, como hoy: iniciar sesión añade sincronización, no la condiciona.
2. **Almacén.** Un documento por usuario con las dos listas.
3. **Fusión sensata.** Si añade algo en el móvil sin conexión y algo distinto en el PC, al
   volver deben quedar las dos cosas, no la última que escriba. Cada entrada ya guarda
   `anadida`, así que fusionar por `id` conservando la fecha más antigua resuelve el caso.
4. **Seguir funcionando sin conexión.** `localStorage` pasa a ser la copia local y la nube el
   espejo, no al revés. Si falla la red, la app no debe romperse.

**Opciones**

| Opción | A favor | En contra |
|---|---|---|
| **Firebase (Firestore + Auth)** | El usuario ya lo usa en Foresee: cuenta creada y conceptos conocidos. Plan gratuito de sobra para esto | Ver el choque con R3, abajo |
| **Supabase** | Equivalente, con API REST muy limpia | Un servicio más que aprender |
| **Solo exportar/importar** | Ya está hecho, cero infraestructura | Manual, y es fácil olvidarse |

**El choque a resolver antes de empezar:** el SDK de Firebase **es una librería**, y este
proyecto prohíbe las librerías (§3, R3). Hay salida: Firestore tiene **API REST**, así que se
puede hablar con él usando `fetch` a pelo y mantener la regla intacta. Es algo más de código,
pero conserva lo que define al proyecto. **Plantéaselo al usuario antes de meter un SDK.**

**Dato que le tranquilizará:** la configuración web de Firebase (`apiKey`, `projectId`…)
**está pensada para ser pública** — no es un secreto como la clave de TMDB. La seguridad no
viene de esconderla, sino de las reglas de Firestore y de la autenticación. O sea: eso sí
puede ir dentro de `index.html` sin problema.

---

## 12. Historial de versiones


| Versión | Fecha | Cambio |
|---|---|---|
| V GMM 0023 | 2026-07-30 | **Cinco carruseles en vez de uno, de 20 títulos y con la nota de TMDB.** (1) El inicio pasa de **un carrusel intercambiable a cinco a la vez**, uno por categoría, montados desde `GMM.config.CATEGORIAS_SUGERENCIA` por `montarCarruseles()`: pista `#carrusel-{clave}`, carga en paralelo, flechas propias y **«Ver más» por bloque** en los tres que tienen intervalo. Con ello se retiran el botón **«Dame sugerencias» y su modal** (`#capaSugerencias`), que existían para elegir cuál se veía, y `estado.categoria`. Los cinco cuelgan de **una sola delegación de clic** en `#descubrimiento` (`[data-mover]`, `[data-vermas]`, `[data-abrir]`, `[data-lista]`), porque las pistas se repintan enteras y un listener por flecha habría que recablearlo. (2) **20 títulos por carrusel** (`TOP_CATEGORIA` 10→20), que es justo una página de `/discover`: **una petición por carrusel**. (3) **Insignia con la nota de TMDB** en cada carátula (`.tarjeta-nota`, verde, ★ + nota), en lugar de la de IMDb: `GMM.ui.tarjeta` la pinta solo si el ítem trae `tmdbNota`, así las cuadrículas siguen sin ella. (4) **Se retira el rodeo por OMDb** de los carruseles —`GMM.util.mejoresPorImdb` → `GMM.util.mejoresPorNota`, `IMDB_MIN` → `NOTA_MIN_CATEGORIA`, fuera `CANDIDATOS_CATEGORIA`—: con cinco carruseles de veinte serían ~120 consultas por visita sobre un tope de 1.000/día, y la lista iría ordenada por un número distinto del que muestra la tarjeta. **OMDb sigue en la ficha.** (5) `alternarLista` invalida la caché de *favoritas* y repinta su carrusel, que ahora está siempre a la vista. `sw.js` VERSION 20→21. `logica.js` 120→125, `interfaz.js` 106→109, `pwa.js` 20. |
| V GMM 0022 | 2026-07-30 | **Rediseño de disposición: los formularios pasan a modales.** (1) Los controles de los dos métodos salen de la página a un **modal-formulario único** (`#capaFormulario`): cuerpo en **una rejilla de dos columnas** con los bloques a `display: contents`, campos **de dos en dos** (los grandes a fila completa), **X** arriba a la derecha y **Buscar centrado** al pie; en el móvil, una columna y con margen alrededor. En el inicio solo quedan **dos botones del mismo tamaño**. (2) Las 5 categorías de «Dame sugerencias» pasan a **otro modal**, una por fila, **todas iguales** y en **azul fijo**; elegir una cierra el modal. (3) **Desplegable de orden junto a la flecha ←**, en su misma fila: reordenar sin volver al formulario (`reflejarOrden` casa por `[data-orden]`, no por id, para las dos copias). (4) **«Ver más» pagina de corrido**: 20 por página y **«Página 1 de N»**, en vez de «2000 · 10 mejores» — se retira `estado.topAnio` y `verMasCategoria` deja de encender `porNota`; **el recorrido año por año de la 0015 se conserva intacto** para cuando se pide a mano. (5) De paso: **300 votos** exigidos siempre que la nota entra en juego (antes solo al ordenar por ella, y «nota ≥ 6 por año» sacaba desconocidos con doce votos), enlace para cambiar de método sin cerrar el modal, autocompletado **en el flujo** dentro del modal, Escape ya no cierra el modal si hay desplegable abierto, y fuera el CSS muerto de `.pestanas`. `sw.js` VERSION 19→20. `logica.js` 120, `interfaz.js` 78→106, `pwa.js` 19→20. |
| V GMM 0021 | 2026-07-29 | **Métodos plegados por defecto + ⚙ redondo.** (1) La app arranca **sin método** (`estado.metodo = ""`): los controles de «Buscar una en concreto» (`#panelBuscar`, `#chips`) y los de «Descubrir por género» (`#descubrir`) y los filtros comunes (`#filtros`) empiezan **ocultos**, y cada uno se muestra **solo al pulsar su botón**. (2) El botón **⚙ pasa a ser un círculo compacto** (`#btnAjustes`, 34 px, engranaje sin reducir) pegado a la derecha de la barra, que se aprieta en móvil para caber en una línea. Solo HTML/CSS + `reflejar()`. `sw.js` VERSION 18→19. `logica.js` 120. **`interfaz.js`/`pwa.js` no ejecutadas (sin npm); pasar en local.** |
| V GMM 0020 | 2026-07-29 | **Ajustes de disposición.** (1) El interruptor Película/Serie sale del buscador a la **barra bajo el header**, a la izquierda junto a *Mis listas* (barra en dos grupos `.barra-izq`/`.barra-der`). (2) El botón **«Ver más»** pasa a la **derecha** de «Dame sugerencias». (3) La app **arranca siempre en «Buscar una en concreto»** (el método ya no se restaura de prefs): los controles de «Descubrir por género» quedan ocultos hasta pulsar su botón, y «Ver más» ya no los deja abiertos al recargar. Solo HTML/CSS + una línea de `cargarPrefs`. `sw.js` VERSION 17→18. `logica.js` 120. **`interfaz.js`/`pwa.js` no ejecutadas (sin npm); pasar en local.** |
| V GMM 0019 | 2026-07-29 | **Carrusel infinito y «Ver más» por año.** (1) Las flechas ‹ › del carrusel **dan la vuelta** al llegar a un extremo (`desplazarCarrusel`, sin clonar tarjetas). (2) Botón **«Ver más»** en las categorías con intervalo (de siempre / nunca es tarde / clásicos): abre la **cuadrícula paginada año por año** con las **10 mejores de cada año** del intervalo, por **nota de TMDB ≥ 6** (el carrusel sigue con IMDb; la cuadrícula usa TMDB porque serían cientos de consultas a OMDb). Reutiliza el recorrido de la 0015 con `estado.topAnio` = 10 (corta cada año a 10 y avanza de año en año; etiqueta «1950 · 10 mejores»). Se apaga al buscar a mano o tocar un criterio. `sw.js` VERSION 16→17. `logica.js` 120 (UI + reúso). **`interfaz.js`/`pwa.js` no ejecutadas (sin npm); pasar en local.** |
| V GMM 0018 | 2026-07-29 | **Las tarjetas del carrusel abren la ficha completa** (`abrirFicha`, como buscar por título), no el modal. Arregla de paso que en la 0017 el clic en el carrusel **no hacía nada**: la delegación de `[data-abrir]`/`[data-lista]` vivía solo en `#resultados`, que no alcanza a `#descubrimiento`; ahora `#carrusel` tiene su propio listener (`[data-abrir]`→`abrirFicha`, `[data-lista]`→`alternarLista`). `sw.js` VERSION 15→16. `logica.js` sin cambios (120; el arreglo es de cableado de eventos). **`interfaz.js`/`pwa.js` no ejecutadas en el entorno remoto (sin npm); pasar en local.** |
| V GMM 0017 | 2026-07-29 | **Carrusel de sugerencias en el inicio**, bajo el header y encima del buscador (sección `#descubrimiento`, solo visible en el inicio vía `fijarPantalla`). Por defecto **Tendencia** (`GMM.tmdb.tendencia` → `/trending/{movie\|tv}/week`, endpoint nuevo); el botón «Dame sugerencias» despliega 5 categorías: Tendencia, Las 10 de siempre (2000→hoy), Nunca es tarde (1980–2000), Clásicos (1950–1979) y Lo que prefieres (favoritas). **El «top 10» se rankea por nota REAL de IMDb** (>6): candidatos de TMDB → `imdb_id` (`ficha`) → nota (`omdb.notas`), en lotes de 5, y `GMM.util.mejoresPorImdb` (pura) filtra/ordena/corta. Perezoso y cacheado por `tipo:categoria`; sin clave de OMDb cae a la nota de TMDB. Respeta el interruptor peli/serie; las tarjetas abren el detalle. `sw.js` VERSION 14→15. `logica.js` 115→120. **`interfaz.js`/`pwa.js` no ejecutadas en el entorno remoto (sin npm); pasar en local.** |
| V GMM 0016 | 2026-07-29 | **Notas de IMDb, Rotten Tomatoes y Metacritic** en la ficha (y en el modal de detalle), vía **OMDb** como fuente **secundaria y opcional**. Módulo nuevo `GMM.omdb` (bloque JS 5b): `parsear` normaliza la respuesta a `{ imdb, rt, meta }` y `notas(imdbId)` **nunca lanza** (fallo → `null`). Se cruza por el `imdb_id` de TMDB —suelto en películas, vía `external_ids` en series—. Segunda clave **opcional** en ⚙ (`gmm_omdb_key`): sin ella la app va igual. Solo se consulta en la ficha, no en las cuadrículas (tope de 1.000/día). `sw.js`: `omdbapi.com` a **solo red** (las notas cambian). `logica.js` 106→115. **`interfaz.js` y `pwa.js` no se pudieron correr en el entorno remoto (sin npm para `playwright-core`); pasar en local.** |
| V GMM 0015 | 2026-07-28 | **Descubrir se ordena, y por dos criterios a la vez.** Tres interruptores —*Más recientes*, *Más antiguas*, *Mayor puntuación*—: los dos de fecha se excluyen, el de nota se combina con cualquiera. El «Año» exacto pasa a ser un **intervalo desde–hasta**, que es lo que permite pedir «las mejor puntuadas de los últimos años». Como `sort_by` de TMDB admite **una sola clave**, la combinación año + nota se resuelve **recorriendo los años uno a uno** y pidiéndole a cada uno su lista por nota: sale 2026 primero y, dentro de 2026, las mejor puntuadas, sin coste extra —una petición por página—. El paginador pasa de «Página 3 de 40» a **«2026 · página 3 de 5»** y salta solo los años vacíos. Además: las consultas cortan en la fecha de hoy (ordenar por fecha descendente llenaba la primera página de **estrenos futuros**) y ordenar por nota exige **300 votos**, medido contra la API real. `logica.js` 92→106, `interfaz.js` 59→72. |
| V GMM 0014 | 2026-07-28 | **Arreglo:** el modal de detalle no hacía scroll y en móvil el contenido de abajo (países, botones) quedaba cortado si la ficha era alta. Ahora el modal se limita a la altura de la pantalla (`max-height: calc(100dvh - 40px)`, con `100vh` de reserva) y el **cuerpo hace scroll interno** (`flex`, `min-height: 0`, `overflow-y: auto`), con cabecera y pie fijos. |
| V GMM 0013 | 2026-07-28 | **Títulos alternativos por país** en la ficha: sección «También conocida como» que muestra cómo se llama el título en otros mercados (ej. *Duro de matar* → «La jungla de cristal» en España). Se pide con `append_to_response=alternative_titles` (sin llamada extra) y se filtra a mercados en español + inglés (`GMM.util.titulosAlternativos`). `logica.js` 86→92. |
| V GMM 0012 | 2026-07-28 | **Header fijo**: `position: sticky; top: 0` (z-index 50, por debajo de modales y avisos), de modo que la cabecera queda pegada arriba al hacer scroll. Su fondo sólido tapa el contenido que pasa por debajo. |
| V GMM 0011 | 2026-07-28 | Retoques de cabecera y métodos: los dos botones de método van **en una fila** (también en móvil) y el **seleccionado se tiñe con color sólido y un halo** de iluminación. El **punto de estado** queda a la derecha del header, en la misma línea que marca e icono (ya no baja en móvil). El botón **⚙ Ajustes sale del header** a la barra de Mis listas (a su derecha), junto con *Instalar*; así el **header es más bajo**. |
| V GMM 0010 | 2026-07-28 | Los métodos **«Buscar una en concreto» / «Descubrir por género»** salen de su contenedor (la pastilla segmentada) y quedan como **dos botones sueltos, centrados y debajo** del interruptor Película/Serie. Remata el rediseño de la 0009. |
| V GMM 0009 | 2026-07-28 | **Rediseño de disposición.** El buscador deja de ser una caja: controles sueltos y **centrados**. La pastilla de modo pasa a ser un **punto** (verde en vivo / naranja demo) y **Mis listas** sale del header a una barra debajo. **Dos pantallas**: al haber resultados el formulario se oculta y aparece una flecha **←** para volver (`fijarPantalla`), de modo que se ven header + flecha + paginador + carátulas sin pasar por el formulario. Cuadrícula a **2 columnas** en móvil, paginador con **Anterior/Siguiente en una fila**, y la frase del título a **una línea** en móvil. Los filtros se eligen antes de buscar (ya no se refinan en vivo). `interfaz.js` 58→59. |
| V GMM 0008 | 2026-07-28 | **Paginador** en Descubrir y Trama: 20 por página con **Anterior / Página X de N / Siguiente**, que recorre todas las páginas de TMDB (`estado.ctxPagina` + `irAPagina`). Sustituye el volcado de 250 de la 0007: en vez de traer muchos de golpe, se pasa de página. |
| V GMM 0007 | 2026-07-28 | **Descubrir pagina**: en vez de los 20 de una sola página de `/discover`, traía más de una. Sustituido en 0008 por un paginador con controles. |
| V GMM 0006 | 2026-07-28 | Buscador reestructurado: un **interruptor global Película/Serie** (naranja/azul, solo tiñe sus acentos) y **dos formas de buscar separadas** —«buscar una en concreto» (desplegable título/actor/trama) y «descubrir por género»—, que antes estaban mezcladas en pestañas. El interruptor manda en **las cuatro búsquedas**: se busca una **serie por título** (`/search/tv`), la **filmografía en TV** de un actor (`/person/{id}/tv_credits`) y **tramas en series** (`/discover/tv` con keywords). El «Tipo» que vivía dentro de Descubrir desaparece: lo lleva el interruptor. `logica.js` 82→86, `interfaz.js` 49→55. |
| V GMM 0005 | 2026-07-28 | Nuevo modo **¿Qué quieres ver?**: se elige tipo (película o serie), género, año (opcional) y nota mínima de TMDB, y sale una cuadrícula con lo que encaja (endpoints `/discover/movie` y `/discover/tv`). Entran las **series** en la app, con la capa de datos hecha «consciente del tipo» (`GMM.util.normalizarMedia`, `disponibilidad` y listas indexadas por `tipo:id`). Géneros como taxonomía fija en `GMM.datos`. Cabecera **rediseñada como tira de rollo de película** (solo aspecto, mismo contenido). Las series de la demo van sin carátula a propósito, porque no había forma de verificar la imagen. Descartadas por ahora las puntuaciones de IMDb/Rotten Tomatoes. `logica.js` pasa de 64 a 82 comprobaciones. |
| V GMM 0001 | 2026-07-27 | Versión inicial. Buscador en tres modos (película, actor, trama), filtros de plataforma/país/idioma, deducción de idioma por mercado con insignias de confianza, fichas con carátula, filmografía con consulta en lote, listas de favoritas y pendientes con exportar/importar, modo demo de 8 películas. Añadidos `CLAUDE.md`, `PROMPT-MAESTRO.md`, carpeta `pruebas/` y el skill `givemymovies-commit`. |
| V GMM 0002 | 2026-07-27 | Distinguir «no está en ninguna parte» de «está, pero no en la plataforma que filtraste». Antes ambos casos daban el mismo mensaje genérico. Ahora la frase nombra la plataforma que falla y un botón quita el filtro de un clic. Lo destapó una búsqueda real: *Siempre el mismo día* + Netflix, que no existe en Netflix en ningún país aunque sí en 14 mercados hispanohablantes. |
| V GMM 0004 | 2026-07-28 | Publicada en GitHub Pages. El cargador de la clave local solo se pide cuando la app corre en local, para que el sitio publicado no lance un 404 en la consola de todo el que lo abra. `pruebas/cargar.js` pasa a buscar el bloque `<script>` de la app con `lastIndexOf`, porque ahora hay dos. |
| V GMM 0003 | 2026-07-28 | Aplicación instalable en el móvil: `manifest.json`, `sw.js`, iconos generados desde `iconos/icono.svg`, botón *Instalar* en la cabecera y bloque JS 10 (`GMM.pwa`). Funciona sin conexión salvo para consultar disponibilidad, que **nunca se cachea** a propósito. Nueva suite `pruebas/pwa.js` con 19 comprobaciones sobre un servidor local. |
