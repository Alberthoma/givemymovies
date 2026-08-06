# CLAUDE.md — givemymovies

> Contexto del proyecto para cualquier sesión futura. Léelo entero antes de tocar código.

**Versión activa:** `V GMM 0036` (validación local; aún no publicada)
**Próxima versión:** `V GMM 0037`
**Última actualización:** 2026-08-06

**Publicada en:** <https://alberthoma.github.io/givemymovies-g/> · GitHub Pages desde `main`, raíz.

> **Antes de tocar el código de una versión publicada, respáldala.** Copia `index.html`,
> `sw.js` y `manifest.json` a `respaldos/V-GMM-XXXX/` y **commitéalo** (los iconos no: apenas
> cambian y ya los conserva git en `iconos/`). Los respaldos se versionan en git a propósito,
> para que la copia sobreviva a un cambio que salga mal se trabaje desde donde se trabaje,
> también desde un entorno remoto y efímero. Detalle en `respaldos/LEEME.md`.

> **Después de cualquier cambio, ejecuta el skill `givemymovies-commit`.** Sube la versión,
> actualiza este archivo, `HISTORIAL.md` y `PROMPT-MAESTRO.md`, y pasa las pruebas. No lo hagas
> a mano: el protocolo tiene pasos que es fácil olvidar.
>
> **Guardar y publicar son dos actos separados.** «commit», «guarda» o «cierra la versión» hacen
> todo el protocolo y **paran en el commit local**. Solo «publica», «sube» o «push» hacen el
> `push` — y como Pages sirve desde `main`, eso **actualiza la web para cualquiera**. Ante la
> duda, parar en el commit: publicar de más no se deshace.

### Cómo orientarte sin gastar contexto

**Este archivo se carga entero y solo, al arrancar la sesión.** No hace falta pedir que «te
pongas en contexto» ni que «leas el proyecto»: ya está hecho, y gratis. Todo lo demás se abre
**solo cuando la pregunta lo exige** — está separado justo para eso:

| Si hace falta… | Abre |
|---|---|
| Tocar el código | Nada más que esto. Localiza con Grep en `index.html` y lee **solo el rango**: entero son ~78.000 tokens |
| Saber **por qué** se hizo algo en una versión | `HISTORIAL.md` |
| Retomar un tema aparcado (login, proxy, premios) | `PENDIENTES.md` |
| Cerrar una versión | El skill `givemymovies-commit`, que trae el protocolo |
| Reconstruir el proyecto entero | `PROMPT-MAESTRO.md`, **por secciones, nunca entero** |

Los guardarraíles que impiden romper algo están **aquí**, en §4 y §9. Si vas a tocar el modal,
los carruseles, el orden de Descubrir o las pruebas, léelos antes: cada uno dice qué no hacer y
por qué se decidió así.

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
| **Sin librerías** | Ni frameworks, ni CDNs, ni npm. JavaScript a pelo. **Única excepción, consciente y pedida por el usuario: el SDK de Firebase** (`GMM.cuenta`, desde V GMM 0029), cargado con `<script>` clásicos desde `gstatic.com`. Es la única dependencia externa de todo el proyecto — la alternativa (hablar con las API REST de Firebase a mano) se le planteó primero y prefirió el SDK. Nada más se salta esta regla. |
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
| 7b | `js/biblioteca.js` | `GMM.biblioteca` — «Mis compras»: enlace a tu copia por título (Nivel 1) |
| 7c | `js/drive.js` | `GMM.drive` — Google Drive (Nivel 2): OAuth implícito, buscar, reproducir |
| 7d | `js/cuenta.js` | `GMM.cuenta` — acceso opcional (Firebase): login, registro, recuperar contraseña, sincronizar Mis listas |
| 8 | `js/ui.js` | `GMM.ui` — pintado de componentes, avisos |
| 9 | `js/app.js` | `GMM.app` — estado, vistas, eventos, arranque |
| 10 | `js/pwa.js` | `GMM.pwa` — service worker y botón de instalar |

### GMM Server — integrado con “Te la tengo” en validación local

`gmm-server/` es el servidor multimedia personal de GiveMyMovies, **no Jellyfin ni Plex**.
Su objetivo es leer películas de carpetas locales o discos externos y entregarlas directamente
a GMM sin subir los vídeos a Drive ni a otra nube. La fase 2 local conecta la PWA con el
servidor: Node.js 22, sin dependencias npm, configuración y catálogo en
`gmm-server/PRIVADO/` (ignorado), escaneo recursivo, título/año desde el nombre, persistencia,
disco desconectado sin borrar el catálogo y API local protegida. `npm.cmd test` pasa **16/16**.
La primera biblioteca real completa detectó 37 vídeos disponibles (105,4 GB), 21 MP4 y
16 MKV, sin publicar la ruta del disco; la ubicación exacta solo vive en `PRIVADO/`.
Desde la V GMM 0032, un archivo nuevo o modificado debe conservar tamaño y fecha en dos
revisiones consecutivas antes de pasar de `copiandose` a `disponible`.

La PWA guarda en su propio navegador la URL y la clave, consulta `/api/catalogo`, completa las
carátulas desde TMDB y muestra la vista **▶ Te la tengo**. Para cada reproducción o descarga pide
un enlace temporal: el servidor conserva la ruta física internamente, admite solicitudes HTTP
por rango y nunca envía la clave ni la ruta al reproductor. La API pública no tiene borrado.

**Límites actuales:** no hay transcodificación con FFmpeg (algunos MKV pueden descargarse pero
no reproducirse en el navegador) ni acceso remoto configurado. La siguiente fase de red es
Tailscale, sin abrir el puerto 7399 al Internet público. Manual y comandos en `gmm-server/README.md`.

**Desde V GMM 0036, `gmm-server/GMM-Server.vbs` abre una app de escritorio propia** —
`GMM-Server-Panel.ps1`, PowerShell + Windows Forms, sin dependencias— para manejar el servidor
sin PowerShell a la vista: iniciar/detener con un botón, **escanear ahora** sin reiniciar (llama
a `POST /api/escanear`, que ya existía en la API), **añadir/quitar carpetas** con el selector
nativo de Windows (`FolderBrowserDialog`, nunca escribiendo la ruta a mano), la clave de
administración visible con botón «Copiar», y **bandeja del sistema**: si cierras la ventana con
el servidor encendido, se oculta ahí y sigue corriendo en segundo plano. Protegida contra abrir
dos copias a la vez (un `Mutex` con nombre) y contra creer que arrancó cuando en realidad se cayó
sola por el puerto ocupado (comprobación con temporizador tras el arranque). Los `.bat` de antes
(`1-configurar-y-escanear.bat`, `2-iniciar-servidor.bat`) se conservan como alternativa manual.
**Trampa evitada:** lanzar PowerShell con `-WindowStyle Hidden` hace que la PRIMERA ventana que
cree el proceso —el propio formulario— nazca invisible (herencia del estado inicial de Windows);
el lanzador abre PowerShell normal y es el script el que se oculta su propia consola ya en
marcha, así el formulario sale visible sin problema.

### Aplicación instalable (PWA)

| Archivo | Para qué |
|---|---|
| `manifest.json` | Nombre, iconos, colores y `display: standalone`. **Rutas relativas** (`./`): en GitHub Pages el sitio cuelga de `/givemymovies-g/`, no de la raíz |
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

**Desde V GMM 0034, `GMM.pwa.iniciar()` pide `navigator.storage.persist()`** al arrancar: le
dice al navegador que no evicte el almacenamiento de este sitio bajo presión de espacio o por
no visitarlo en un tiempo. No pide permiso al usuario (el navegador decide solo) y nunca lanza
si la API no existe. Se añadió al investigar un reporte de claves "borradas" que resultó no ser
un fallo (ver §4 «Persistencia» sobre por qué las claves no viajan entre dispositivos); se deja
de todos modos como mejora de robustez.

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
junto a *Mis listas* (antes estaba dentro del buscador). **Desde V GMM 0030 la barra se reubicó a
petición del usuario:** `.barra-izq` lleva Mis listas, el interruptor **y** ⚙ (en ese orden);
`.barra-der` se queda solo con Instalar. `#btnBiblioteca` («Mis compras») sigue en el DOM y con su
lógica intacta, pero **oculto** (`.oculto` estático, no condicional) — no aportaba lo suficiente
para tener sitio en la barra; «Mi copia» en cada ficha sigue funcionando igual. El botón de
**cuenta** (`#btnCuenta`) se mudó del `.barra-der` al **header**, en el hueco que dejó el punto de
estado; el punto de estado (`#pastillaModo`) bajó a la fila del título del buscador, a su derecha,
posicionado en `absolute` para no descuadrar el centrado del título. Sigue teniendo id
`#tipoSwitch`, así que `reflejar()` y sus acentos (`#buscador[data-tipo]`, `#descubrimiento[data-tipo]`)
funcionan igual. **La app arranca sin método elegido** (`estado.metodo = ""`; desde V GMM 0021,
antes era «buscar»), y el método no se restaura de `gmm_prefs`: cada recarga vuelve a ese arranque
limpio. **El botón ⚙ sigue siendo un círculo compacto** (`#btnAjustes`, 34 px, el engranaje sin
reducir), solo que ya no está pegado a la derecha de la barra: vive en `.barra-izq`.

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
- `.oculto` **hay que repetirlo** para esos bloques (`.forma .panel-buscar.oculto`, …), porque
  `display: contents` le gana en especificidad. El porqué, en §9.
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
documento. El porqué, en §9.

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
(`alPulsarOrden`) sirve a ambas. **Al contar en las pruebas hay que acotar a `#orden`**; ver §9.

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

**Se ordenan por la nota de TMDB, y esa misma nota es la que luce cada tarjeta.**
`GMM.util.mejoresPorNota` (pura y testable) filtra por `NOTA_MIN_CATEGORIA` (6), ordena y corta a
`TOP_CATEGORIA` (20), que es justo lo que cabe en una página de `/discover`: **una sola petición
por carrusel**.

**Desde V GMM 0024 la insignia `.tarjeta-nota` sale en TODAS las tarjetas** —carruseles, Descubrir,
«Ver más», filmografía, listas—, no solo en los carruseles. `GMM.ui.tarjeta` usa `tmdbNota` si el
ítem la trae (la marcan los carruseles vía `conNota()`) y, si no, cae al `vote_average` que traen
las cuadrículas. **Se oculta solo cuando la nota no existe:** TMDB devuelve `0` para un título sin
votos, así que `0` cuenta como «sin nota» y no se pinta. Antes (0023) las cuadrículas la omitían a
propósito; el usuario pidió que se viera siempre que exista.

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

### La cuenta y sincronizar Mis listas y ajustes (desde V GMM 0029; ajustes desde la 0035)

**Acceso opcional, nunca obligatorio.** La app funciona entera sin iniciar sesión, exactamente
igual que siempre; iniciar sesión solo añade que **Mis listas** (favoritas y pendientes) y,
desde la V GMM 0035, **las claves de TMDB, OMDb y GMM Server** viajen entre dispositivos. No
hay pantalla de entrada que bloquee nada — es justo lo contrario de un muro de login, a
propósito: se descartó con el usuario (ver `PENDIENTES.md` §2).

**Correo y contraseña, no Google.** `PENDIENTES.md` §2 recomendaba entrar con Google (cero
fricción, sin contraseña que gestionar); el usuario pidió expresamente correo/contraseña con
registro y «olvidé mi contraseña», así que es lo que hay. Nada impide añadir Google más
adelante como método adicional.

**`GMM.cuenta` (bloque 7d) usa el SDK de Firebase, no su API REST.** Es la única excepción a la
regla «sin librerías» (§3): el usuario la pidió explícitamente después de ver la alternativa
(hablar con Identity Toolkit + Firestore a mano por `fetch`, gestionando el refresco de token).
El SDK se carga en tres `<script>` clásicos (build **compat**, sin `type="module"`) desde
`gstatic.com`, justo antes del `<script>` de la app. **Sin internet esos `<script src>` no
cargan** y `firebase` queda `undefined`: `GMM.cuenta.disponible()` lo detecta y toda la app
sigue funcionando igual, solo que sin cuenta. El SDK gestiona su propia sesión (no hace falta
guardar tokens a mano en `localStorage`, a diferencia de `GMM.drive`).

**Mis listas es «última escritura gana» en el documento, pero fusionando al entrar.** Cada
cambio en Mis listas (`alternarLista`, `vaciarLista`, importar un backup) sube las listas
completas a Firestore (`usuarios/{uid}`, campos `favoritas`/`pendientes`), agrupado con
`GMM.util.retardo` para no escribir en cada clic. **Al iniciar sesión** —no al guardar—, se trae
lo que hubiera en la nube y se fusiona con lo que ya había en este dispositivo
(`GMM.util.fusionarListas`, pura y testable): une por `(id, tipo)` sin duplicar y, si una
entrada está en los dos lados, conserva la fecha `anadida` más antigua. Así, entrar en un
dispositivo nuevo no borra lo que tenía otro.

**Las claves (campo `ajustes`, desde V GMM 0035) son «la nube siempre gana», sin fusión —
decisión explícita del usuario.** A diferencia de las listas, una clave no es una colección que
se pueda unir: o gana una o gana otra. `sincronizarYa()` sube `{ tmdb, omdb, servidorUrl,
servidorClave }` junto con las listas, en el mismo documento y la misma escritura.
`aplicarAjustesRemotos()`, dentro de `fusionarAlEntrar()`, adopta cada campo de la nube en este
dispositivo **solo si la nube trae algo** (nunca vacía un dispositivo por culpa de una cuenta
recién creada sin ajustes todavía) y refresca los campos de ⚙ si el panel está abierto en ese
momento. El botón **Guardar** de ⚙ dispara `GMM.cuenta.sincronizar()` tras guardar en local, igual
que ya hacía `alternarLista` con las listas. Riesgo asumido y aceptado: si algún día se quisiera
una clave distinta a propósito en un dispositivo, se perdería al volver a iniciar sesión — el
usuario prefirió la simplicidad de «cambio la clave una vez y viaja a todos lados».

**La config web de Firebase no es secreta** (`apiKey`, `projectId`… en `GMM.config.FIREBASE`):
está pensada para ser pública, la seguridad la dan las reglas de Firestore y de Authentication,
no ocultar esos valores. Por eso vive directamente en `index.html`, igual que el resto de
`GMM.config`.

**Firestore exige reglas publicadas a mano en la consola de Firebase** (no algo que el código
pueda hacer): la colección `usuarios` solo debe permitir leer/escribir el propio documento,
comparando `request.auth.uid` con el id del documento. Sin esas reglas publicadas, y sin el
método «Correo/contraseña» activado en Authentication, nada de esto funciona en la web
publicada aunque el código esté bien. Las reglas correctas viven versionadas en `firestore.rules`
(desde V GMM 0031), como referencia — ese archivo **no se aplica solo**, hay que pegarlo y
publicarlo en la consola.

**Cuando sincronizar falla por permisos, la app lo avisa (desde V GMM 0031).** Antes las dos
operaciones contra Firestore (`sincronizarYa` con `.set` y `fusionarAlEntrar` con `.get`)
tragaban cualquier error con un `.catch` vacío: si las reglas estaban cerradas, las listas no
viajaban y no había ni una señal de por qué. Ahora ambas pasan por `tratarFalloSync`, que
distingue el `error.code`: un `permission-denied` (reglas mal puestas) muestra un aviso
—una sola vez por sesión, con el guarda `avisadoPermiso`, para no repetirlo en cada clic—, y
cualquier otro fallo (típicamente red, estar sin conexión) se sigue callando, que ahí es lo
correcto. Es la misma filosofía del §2: decir *por qué* algo no funciona vale la mitad.

**Desde V GMM 0035, el documento de Firestore guarda algo más sensible que preferencias de
cine: la clave de GMM Server es un token real de acceso al servidor multimedia personal del
usuario.** La protección es la misma que ya tenían las listas —las reglas de `firestore.rules`
solo dejan leer/escribir el documento propio (`request.auth.uid == uid`)—, no una nueva; es una
decisión consciente, aceptada explícitamente por el usuario, de apoyarse en esa misma protección
en vez de dejar la clave fuera de la sincronización.

### Persistencia (`localStorage`)

| Clave | Contenido |
|---|---|
| `gmm_tmdb_key` | Clave de la API de TMDB. **Sincroniza** con la cuenta desde V GMM 0035 |
| `gmm_omdb_key` | Clave de la API de OMDb (opcional; notas de IMDb/RT/Metacritic). **Sincroniza** desde V GMM 0035 |
| `gmm_prefs` | Modo, plataforma, país, idioma y los criterios de Descubrir (género, intervalo de años, nota, orden). No sincroniza |
| `gmm_listas` | `{ favoritas: [], pendientes: [] }`. Sincroniza desde V GMM 0029 (fusiona, no sustituye) |
| `gmm_biblioteca` | `{ "tipo:id": { title, poster_path, enlace, guardada, … } }` — «Mis compras», el enlace a tu copia por título. No sincroniza |
| `gmm_gdrive_client_id` | Client ID de Google para el Nivel 2 (Drive). El **token** de acceso vive en `localStorage` (`gmm_gdrive_token`/`_exp`, 1 h; en `sessionStorage` se perdía al cerrar la app en iOS — ver V GMM 0028). No sincroniza |
| `gmm_servidor` | `{ url, clave }` de GMM Server (desde V GMM 0033) — dirección y clave privada del servidor multimedia personal, ver «GMM Server» más abajo. **Sincroniza** desde V GMM 0035 |
| *(ninguna clave propia)* | La sesión de `GMM.cuenta` (Firebase, desde V GMM 0029) no usa `localStorage`: el SDK persiste su propia sesión internamente (IndexedDB) |

**Qué sincroniza con la cuenta y qué no, y por qué importa distinguirlo:** `gmm_listas`
siempre sincronizó (V GMM 0029); `gmm_tmdb_key`/`gmm_omdb_key`/`gmm_servidor` se sumaron en la
V GMM 0035, a petición del usuario, con **«la nube siempre gana»** en vez de fusión (ver «La
cuenta y sincronizar…» más arriba). `gmm_prefs`, `gmm_biblioteca` y `gmm_gdrive_client_id`
siguen siendo **por dispositivo, a propósito** — no se ha pedido que sincronicen. Confundir
«no sincroniza» con «se borró» ya pasó una vez (V GMM 0034, antes de que existiera el
sincronizado de claves): el usuario reportó claves "borradas" al entrar en el móvil, y en ese
momento era justo eso — nunca se habían pegado ahí. Si vuelve a pasar hoy con `gmm_prefs`,
`gmm_biblioteca` o `gmm_gdrive_client_id`, sigue siendo lo mismo: esas tres nunca han
sincronizado.

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

### Datos: Firebase (cuenta y sincronizar Mis listas, desde V GMM 0029)

| Uso | Cómo |
|---|---|
| Login, registro, cerrar sesión, recuperar contraseña | SDK de Firebase Auth (`firebase.auth()`), no la API REST — ver §4 «La cuenta…» para el porqué |
| Sincronizar `gmm_listas` y claves | Firestore (`firebase.firestore()`), un documento por usuario en `usuarios/{uid}` con los campos `favoritas`/`pendientes` y, desde V GMM 0035, `ajustes: { tmdb, omdb, servidorUrl, servidorClave }` |

Proyecto de Firebase: `givemymovies-x`. La config (`GMM.config.FIREBASE`) no es secreta, ver §4.
Requiere, hechos a mano en la consola de Firebase (no algo que el código resuelva):
**Authentication → Sign-in method → activar «Correo/contraseña»**, y **Firestore → Reglas →
publicar** que cada documento de `usuarios` solo lo lea/escriba su propio dueño
(`request.auth.uid == uid`). Sin esos dos pasos, la cuenta no funciona en la web publicada
aunque el código esté bien.

Errores de Auth traducidos en `GMM.cuenta.interpretarError` por el `code` del SDK
(`auth/email-already-in-use`, `auth/wrong-password`, `auth/too-many-requests`…), mismo espíritu
que los errores nombrados de TMDB/OMDb.

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
node pruebas/logica.js      # 184 comprobaciones · sin dependencias · instantáneo
node pruebas/imagenes.js    #  15 comprobaciones · necesita internet · ~30 s
node pruebas/interfaz.js    # 127 comprobaciones · playwright-core y, desde 0029, internet ·  ~60 s
node pruebas/pwa.js         #  20 comprobaciones · playwright-core · ~20 s
```

Las versiones 0024–0028 se cerraron en un entorno remoto enlazando el `playwright-core` global
(ver el recuadro de abajo): `logica.js` pasó **166/166**, e `interfaz.js` (**120**) y `pwa.js`
(**20**) corrieron con Chromium del sistema. Los únicos fallos fueron los contadores de «errores
acumulados», por recursos que este entorno cerrado no sirve (`image.tmdb.org` bloqueado por el
proxy y ausencia de `PRIVADO/clave-local.js`), **idénticos byte a byte en los respaldos**, así que
no son regresión. En local, con clave e internet, esos contadores vuelven a cero. El service worker
cacheó `gmm-app-v26` correctamente. **El OAuth real de Drive (Nivel 2) no se puede probar en
remoto** —necesita el Client ID del usuario y su sesión de Google sobre HTTPS—, así que sus tests
stubean `GMM.drive`; la verificación de punta a punta la hace el usuario en la web publicada.

**La V GMM 0029 se cerró en local** con las tres suites: `logica.js` **177/177**, `interfaz.js`
**127/127** y `pwa.js` **20/20** (caché `gmm-app-v27`). Desde esta versión `interfaz.js` también
necesita internet, no solo `playwright-core`: la app carga el SDK de Firebase con tres
`<script src="…gstatic.com/…">` (ver §3 y §4), y sin red esas peticiones fallarían — el filtro de
«errores acumulados» ya las descarta como conocidas (mismo trato que el 404 de
`PRIVADO/clave-local.js`), pero conviene saber por qué. El login/registro/recuperar contraseña y
la sincronización real de Firebase **no se pueden probar en CI**, así que sus tests stubean
`GMM.cuenta` igual que ya se stubea `GMM.drive`; la verificación de punta a punta —cuenta real,
correo de recuperación, listas viajando entre dos navegadores— la hace el usuario en la web
publicada.

**La V GMM 0030 (reubicación de la barra) se cerró en local**, mismas tres suites:
`logica.js` **177/177**, `interfaz.js` **127/127** (`#btnBiblioteca` se prueba quitándole
`.oculto` antes del clic, porque un elemento `display: none` no tiene caja que pinchar ni con
`{ force: true }`) y `pwa.js` **20/20** (caché `gmm-app-v28`). Verificado además visualmente
contra `pruebas/capturas/00-inicio.png`.

**La V GMM 0031 (aviso de fallo de sincronización) cambia solo JS de `GMM.cuenta`**, sin tocar el
DOM ni el CSS, así que basta `logica.js` **177/177** (§7: «cualquier cambio de JS → `logica.js`
como mínimo»). El nuevo `tratarFalloSync` no es una función exportada ni pura —solo decide si
llamar a `GMM.ui.aviso` según `error.code === "permission-denied"`—, y `interfaz.js` ya stubea
`GMM.cuenta` entero, de modo que no exercitaría el cambio; no se añadieron comprobaciones. Al
publicar hay que subir `sw.js` a `gmm-app-v29` (ya hecho) para que los navegadores con la app
cacheada reciban esta versión.

> **Correr `interfaz.js`/`pwa.js` en remoto, sin npm** (aprendido en la 0024): aunque
> `npm install playwright-core` esté bloqueado por la política de red, el entorno suele traer un
> **`playwright` global** (que incluye `playwright-core`) y **Chromium** ya descargado en
> `/opt/pw-browsers`. Se enlazan sin tocar los tests: `NODE_PATH="$(npm root -g):$(npm root -g)/playwright/node_modules"`
> para que `require("playwright-core")` resuelva, y un symlink `~/ms-playwright/chromium-<n> →
> /opt/pw-browsers/chromium-<n>` para que `buscarChromium()` lo encuentre. Con eso las tres suites
> corren en remoto; no hace falta esperar a un pase local salvo `imagenes.js` (necesita clave e
> internet). **Ya no es obligatorio saltárselas como en 0016–0021.**

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
y la forma del config de categorías, y —desde la 0024— la **filmografía con facetas**
(`GMM.util.filmografiaConFacetas`: reparto vs. dirección, deduplicado, la dirección gana al
solapamiento), la **ficha técnica** (`GMM.util.fichaTecnica`/`tieneFichaTecnica`: dirección,
guion, música, fotografía, país, productoras, reparto; y `created_by` en serie) y las
**colecciones** (`GMM.datos.COLECCIONES`/`esColeccion`/`coleccion`: forma, prefijo `col:`, la
keyword del cómic de Marvel/DC con su reserva verificada, y `GMM.util.combinarKeywords`, que une
los ids resueltos con los de reserva sin vacíos ni duplicados). `interfaz.js` recorre el interruptor
peli/serie, la búsqueda de una serie por título, Descubrir con series, los interruptores de
orden con su paginador por años, —desde la 0021— los métodos plegados, —desde la 0022— el modal
del formulario (abrir, cerrar con la X), que los dos métodos **midan lo mismo**, que
**«Ver más» diga «Página 1 de 30» con 20 carátulas** y sin etiqueta de año, el desplegable de
orden junto a ← con sus dos copias sincronizadas, y que en el móvil el modal **deje margen y no
ocupe toda la altura**; y —desde la 0023— los **cinco carruseles** (cinco bloques, sus ids de
pista, sus títulos, «Ver más» solo en los tres con intervalo, que el botón y el modal de
sugerencias ya no existan, la insignia de **nota de TMDB** y no la de IMDb, y el corte en 20);
y —desde la 0024— que el desplegable de género ofrezca las **cuatro colecciones** en su grupo;
y —desde la 0025— que el **reparto y la dirección** de la ficha técnica sean botones que abren la
filmografía de esa persona (ficha inyectada + clic, con la red stubeada); y —desde la 0029— la
**fusión de listas al sincronizar** (`GMM.util.fusionarListas`: une por id+tipo, conserva la
fecha `anadida` más antigua, tolera un lado vacío) y los mensajes de `GMM.cuenta.interpretarError`.
`interfaz.js` añade el **modal de cuenta** (V GMM 0029, `GMM.cuenta` stubeado): abre en «entrar»,
cambia de vista sin cerrarse, la X y Escape lo cierran, y con sesión simulada el botón muestra el
correo y el modal abre directo en «perfil».

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
- **Puntuaciones de IMDb / RT / Metacritic**: solo en la ficha y en el modal de detalle, **nunca**
  en las cuadrículas ni en los carruseles — serían decenas de consultas contra el tope de 1.000
  al día de OMDb. Ahí la nota que se ve es la de TMDB (0–10).
- **Filmografías**: se consultan los 24 títulos más populares, con 5 peticiones simultáneas.
- **Premios (Oscar, Emmy)**: **no se filtra por premios**, porque TMDB no los publica —ni
  endpoint ni campo— y aproximarlo sería inventar. Descartado con el usuario; ver `PENDIENTES.md` §3.
- **Google Drive (Nivel 2)**: **solo funciona sobre HTTPS** (en `file://` no hay origen válido
  para OAuth; el Nivel 1, el enlace manual, sí va en local). Exige que el usuario **cree su
  Client ID** en Google Cloud (tipo *Aplicación web*, origen `https://alberthoma.github.io`, con
  la Drive API activada). El token del **flujo implícito caduca a la hora** y hay que reconectar.
  **Mega queda fuera** del automático: su cifrado de extremo a extremo exige su SDK, que es una
  librería. El diseño completo, en `HISTORIAL.md` (apéndice del Nivel 2).
- **Colecciones de Descubrir** (desde V GMM 0024): Marvel/DC abarcan **toda la franquicia** basada
  en el cómic (X-Men, Spider-Man, Deadpool…), no solo el universo cinematográfico. La keyword del
  cómic no tiene id estable/verificable sin clave (`9715` es «superhero», no «marvel comic»), así
  que **se resuelve por nombre en vivo** (`/search/keyword`) y se le suman de reserva los ids de
  universo verificados (MCU/DCEU/DCU). Anime es animación + idioma japonés y Bollywood, idioma
  hindi. Si la resolución por nombre no encontrara la keyword, quedaría solo la reserva (el universo
  cinematográfico), nunca vacío.
- **Cuenta y sincronizar Mis listas (desde V GMM 0029)**: exige internet para cargar el SDK de
  Firebase (`gstatic.com`) — sin conexión al abrir la página, `GMM.cuenta.disponible()` es
  `false` y el botón de cuenta no hace nada, pero el resto de la app sigue intacta. Es la única
  función del proyecto con una dependencia externa (ver §3). La recuperación de contraseña usa la
  plantilla y la página de reseteo por defecto de Firebase, sin personalizar.
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
| **Partir la filmografía se llevó su id** (0024) | Al dividir la filmografía en dos facetas (dirección / reparto) se perdió el `#rejillaFilmografia`, del que dependían **«¿dónde ver todas?»** (itera un solo contenedor) y `interfaz.js` (`#rejillaFilmografia .tarjeta`). Se envuelven las dos secciones en ese mismo id. Al partir un bloque en varios, conserva el contenedor que otros selectores esperan. |
| **El texto de consola de un recurso 404 es genérico** (0024) | `interfaz.js` filtra el error esperado de `clave-local.js`, pero lo hace por el **texto de consola**, que en un fallo de recurso es solo «Failed to load resource: …» **sin la URL**: el filtro no casa. En local no salta porque `PRIVADO/clave-local.js` existe y hay internet; en un entorno cerrado (sin `PRIVADO/`, con `image.tmdb.org` bloqueado) esos contadores de «errores acumulados» fallan **sin ser regresión**. Compara contra el respaldo antes de dar por rota la interfaz. |
| **Un comentario con la palabra `<script>` rompe la extracción del test** (0029) | `pruebas/cargar.js` localiza el `<script>` de la app con `lastIndexOf("<script>", fin)` (ver la trampa de los «Dos bloques `<script>`» más arriba): busca la ÚLTIMA aparición literal de esa cadena antes del cierre. Un comentario dentro del propio bloque JS que mencionara «…ver los `<script>` antes del bloque 1» quedaba más cerca del final que la etiqueta de apertura real, así que `lastIndexOf` la tomaba a ELLA como inicio y `logica.js` reventaba con un `SyntaxError` sin sentido aparente. No escribas la cadena literal `<script>` dentro de un comentario que viva dentro del bloque `<script>` de la app; dila de otra forma («los scripts», «las tres etiquetas»…). |
| **`{ force: true }` de Playwright no rescata un `display: none`** (0030) | Al ocultar `#btnBiblioteca` con `.oculto` estático, el test que lo pulsaba (`pagina.click("#btnBiblioteca")`) empezó a fallar con «Element is not visible» **incluso añadiendo `{ force: true }`**: ese flag salta las comprobaciones de accionabilidad (tapado, inestable…), pero un elemento `display: none` no tiene caja en la página, así que Playwright no tiene dónde hacer clic. La solución fue quitarle `.oculto` con `page.evaluate` justo antes del clic, probando así que la lógica sigue intacta detrás de un botón oculto a propósito. Si ocultas algo que un test pulsa, este es el patrón: **destapar, pulsar, no forzar**. |

---

## 10. Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa. Versión en el pie, en `#version-app` |
| `README.md` | Manual de usuario: clave de TMDB, modos, guía de fraccionamiento |
| `CLAUDE.md` | Este archivo. **Se carga entero en cada sesión: mantenlo denso.** Lo que solo se consulta de vez en cuando va aparte |
| `HISTORIAL.md` | Detalle completo de cada versión, más el apéndice de diseño del Nivel 2 de Drive. §12 de aquí lleva solo la línea corta. **Al cerrar una versión se escribe en los dos** |
| `PENDIENTES.md` | Los temas abiertos, desarrollados. §11 de aquí lleva solo el estado en una línea |
| `PROMPT-MAESTRO.md` | Prompt que reconstruye el proyecto entero. **Actualízalo con cada cambio.** No lo leas entero: trabaja por secciones (~22.000 tokens) |
| `firestore.rules` | Copia de referencia de las reglas de seguridad de Firestore (desde V GMM 0031). **No se aplica solo:** hay que publicarlo a mano en la consola de Firebase. Ver §4 «La cuenta…» |
| `pruebas/` | Herramienta de verificación, opcional y con dependencias propias |
| `gmm-server/` | Servidor multimedia propio 0.2.0: catálogo privado, enlaces temporales de vídeo y descarga. Sus secretos y catálogo viven en `gmm-server/PRIVADO/` |
| `.gitignore` | Excluye `node_modules`, capturas y **`PRIVADO/`** |
| `PRIVADO/` | **Solo local, jamás versionado.** Credenciales y clave de TMDB |
| `respaldos/` | **Versionado en git.** Copia de la app completa por versión, hecha antes de modificarla, como red de seguridad. Ver `respaldos/LEEME.md` |

**Acota las búsquedas para excluir `respaldos/`.** Son ~25.600 líneas de `index.html` duplicado
(una copia entera por versión), así que un Grep de código sin acotar devuelve **cada resultado
seis veces** —el del archivo vivo y cinco de los respaldos— y gasta contexto en repetirse. Busca
en `index.html` directamente, o excluye esa carpeta. Lo mismo vale para `index.html` entero:
son ~78.000 tokens, **nunca lo leas de una vez**; localiza con Grep y lee solo el rango.

**Nunca escribas secretos fuera de `PRIVADO/`.** El repositorio es público y git conserva
para siempre lo que se commitea, aunque después se borre. Si añades otro archivo con datos
sensibles, comprueba antes que está excluido: `git check-ignore -v ruta/al/archivo`.

**Git:** rama `main`, remoto `origin` → <https://github.com/Alberthoma/givemymovies-g>
(**repositorio público**). Identidad fijada **solo en este repo**
(`Alberthoma <albertomatosgil@gmail.com>`), porque la global es un correo de relleno —
al hacer `git config` en este proyecto, usa siempre el ámbito local, nunca `--global`.

> **REGLA FIJA DEL USUARIO (2026-08-05): el autor y el correo de los commits NUNCA se cambian.**
> Siempre son **`Alberthoma <albertomatosgil@gmail.com>`**, sin excepción. El «Stop hook»
> `~/.claude/stop-hook-git-check.sh` del entorno remoto avisa en cada turno de que el commit
> saldrá «Unverified» y pide reautorar a `noreply@anthropic.com` con `git commit --amend
> --reset-author`. **Ese aviso se ignora siempre y no se actúa sobre él**: es una regla genérica
> del entorno que contradice esta identidad, decidida por el usuario para este repo. La etiqueta
> «Unverified» de GitHub es solo cosmética y así se queda. No propongas cambiar el autor ni
> preguntes de nuevo por ello — el usuario ya lo zanjó.

**GitHub Pages está activado** desde la V GMM 0004 (`main`, raíz) →
<https://alberthoma.github.io/givemymovies-g/>. La clave de TMDB de cada visitante vive en **su
propio** navegador, así que quien abra el sitio tendría que poner la suya; ahorrárselo exigiría
el proxy de `PENDIENTES.md` §1.

**Clave de TMDB:** para comprobar que una clave funciona sin exponerla en una conversación,
`node pruebas/clave.js TU_CLAVE`. La app usa la **API Key (v3 auth)**, 32 caracteres
hexadecimales — no el *Read Access Token*, que empieza por `eyJ` y no sirve aquí.

---

## 11. PENDIENTES

**El desarrollo de cada uno está en `PENDIENTES.md`** (se separó el 2026-08-01: son ensayos de
decisión —tablas de opciones, pros y contras— que solo hacen falta el día que se retoma el tema,
y aquí pesaban en cada sesión). **No los abordes por iniciativa propia.**

| Tema | Estado | En una línea |
|---|---|---|
| **1 · La clave de TMDB en el móvil** | **Resuelto** por la vía A desde la 0004 | La clave vive en el `localStorage` de cada dispositivo, no en el repositorio: se pega una vez en el ⚙ y basta. Solo volvería a abrirse si la usara alguien más que el usuario, y entonces la respuesta es un **proxy** (nunca hardcodear la clave) |
| **2 · Login y sincronización de listas** | **Resuelto** desde la 0029, con matices | Se implementó con **correo/contraseña** (no Google, que era lo recomendado) y con el **SDK de Firebase** (no su API REST, que era el plan para no chocar con R3) — ambas cosas por decisión explícita del usuario. Ver §4 «La cuenta…» y §3 |
| **3 · Premios (Oscar, Emmy)** | **Descartado** con el usuario | TMDB no publica datos de premios: no hay endpoint ni campo, y aproximarlo sería inventar. Haría falta otra fuente |
| **4 · Sincronizar claves (TMDB/OMDb/GMM Server) entre dispositivos** | **Resuelto** desde la 0035 | Se implementó con **«la nube siempre gana»**, sin fusión (decisión explícita del usuario, distinta del comportamiento de Mis listas). Ver §4 «La cuenta y sincronizar…» |

---

## 12. Historial de versiones

Una línea por versión. **El detalle completo —el porqué, los nombres de función, los recuentos
de pruebas— vive en `HISTORIAL.md`.** Se separó el 2026-07-31 por coste de contexto: este
archivo se carga entero en cada sesión y el historial detallado era casi un cuarto de su peso
sin hacer falta casi nunca. Ábrelo solo cuando necesites reconstruir **por qué** se hizo algo.

**Al cerrar una versión hay que escribir en los dos:** la línea corta aquí y la fila detallada
en `HISTORIAL.md`.

| Versión | Fecha | Cambio |
|---|---|---|
| V GMM 0036 | 2026-08-06 | Nueva app de escritorio para GMM Server (`GMM-Server.vbs` + `GMM-Server-Panel.ps1`, PowerShell + Windows Forms): iniciar/detener, escanear sin reiniciar, añadir/quitar carpetas con selector nativo, bandeja del sistema. No toca la PWA. |
| V GMM 0035 | 2026-08-05 | Las claves de TMDB, OMDb y GMM Server sincronizan con la cuenta, junto a Mis listas: «la nube siempre gana», a petición explícita del usuario. `sw.js` 31→32 (cubre también el código JS de la 0034, que no subió VERSION por error). |
| V GMM 0034 | 2026-08-05 | `GMM.pwa` pide almacenamiento persistente (`navigator.storage.persist()`) al arrancar, para que el navegador no evicte los datos del sitio. Se confirma además, tras investigar un reporte de claves "borradas", que TMDB/OMDb/GMM Server nunca sincronizaban entre dispositivos por diseño (solo Mis listas lo hacía) — no era un fallo. Resuelto de raíz en la 0035. |
| V GMM 0033 | 2026-08-05 | Integración local de GMM Server 0.2.0: la PWA añade la vista «▶ Te la tengo», guarda URL y clave únicamente en el navegador, consulta el catálogo y pide enlaces temporales para reproducir o descargar sin exponer rutas físicas. El servidor soporta rangos HTTP para adelantar y retroceder en formatos compatibles. `sw.js` 30→31. Publicada el mismo día. |
| V GMM 0032 | 2026-08-05 | Se crea GMM Server 0.1.0: escáner local, catálogo privado, API protegida y detección de archivos todavía copiándose; primera biblioteca real validada con 37 vídeos. El proyecto pasa al repositorio `givemymovies-g` y a su nueva ruta de GitHub Pages. |
| V GMM 0031 | 2026-08-05 | Si sincronizar Mis listas falla por permisos de Firestore, la app avisa en pantalla en vez de callarlo; se añade `firestore.rules` versionado como referencia. |
| V GMM 0030 | 2026-08-02 | Se reubica la barra: cuenta al header, el punto de estado baja al título del buscador, ⚙ y el interruptor junto a Mis listas, y «Mis compras» queda oculto. |
| V GMM 0029 | 2026-08-02 | Cuenta opcional con Firebase (login, registro, recuperar contraseña) y Mis listas sincronizadas entre dispositivos. |
| V GMM 0028 | 2026-07-31 | El token de Google Drive pasa a `localStorage`: la conexión sobrevive a cerrar la app en iOS. |
| V GMM 0027 | 2026-07-31 | «Mi biblioteca» Nivel 2: buscar en tu Google Drive por OAuth, reproducir dentro de la app y descargar. |
| V GMM 0026 | 2026-07-31 | «Mi biblioteca / Mis compras» Nivel 1: pegas el enlace a tu copia y la ficha ofrece reproducir y descargar. |
| V GMM 0025 | 2026-07-31 | El reparto y la dirección de la ficha técnica abren la filmografía de esa persona. |
| V GMM 0024 | 2026-07-31 | Ficha técnica plegable, filmografía de dirección, colecciones (Marvel/DC/Anime/Bollywood) y nota en todas las cuadrículas. |
| V GMM 0023 | 2026-07-30 | Cinco carruseles a la vez en el inicio, de 20 títulos y con la nota de TMDB; fuera el modal de sugerencias y el rodeo por OMDb. |
| V GMM 0022 | 2026-07-30 | Los formularios de los dos métodos pasan a un modal único; el orden se cambia desde los resultados; «Ver más» pagina de corrido. |
| V GMM 0021 | 2026-07-29 | La app arranca sin método elegido, con los tres paneles plegados. El ⚙ pasa a círculo compacto. |
| V GMM 0020 | 2026-07-29 | El interruptor Película/Serie sale del buscador a la barra bajo el header. |
| V GMM 0019 | 2026-07-29 | El carrusel da la vuelta con sus flechas y las categorías con intervalo ganan «Ver más». |
| V GMM 0018 | 2026-07-29 | Las tarjetas del carrusel abren la ficha completa (arregla el clic muerto de la 0017). |
| V GMM 0017 | 2026-07-29 | Carrusel de sugerencias en el inicio, con cinco categorías y el top 10 rankeado por nota de IMDb. |
| V GMM 0016 | 2026-07-29 | Notas de IMDb, Rotten Tomatoes y Metacritic en la ficha, vía OMDb con su clave opcional. |
| V GMM 0015 | 2026-07-28 | Descubrir se ordena por fecha y nota a la vez, recorriendo los años uno a uno; el «Año» pasa a intervalo. |
| V GMM 0014 | 2026-07-28 | Arreglo: el modal de detalle no hacía scroll y en móvil cortaba el contenido de abajo. |
| V GMM 0013 | 2026-07-28 | Títulos alternativos por país en la ficha («También conocida como»). |
| V GMM 0012 | 2026-07-28 | Header fijo al hacer scroll. |
| V GMM 0011 | 2026-07-28 | Retoques de cabecera: métodos en una fila, punto de estado a la derecha y el ⚙ fuera del header. |
| V GMM 0010 | 2026-07-28 | Los dos métodos salen de la pastilla segmentada y quedan como botones sueltos y centrados. |
| V GMM 0009 | 2026-07-28 | Rediseño: controles sueltos, punto de estado y dos pantallas (formulario / resultados con ←). |
| V GMM 0008 | 2026-07-28 | Paginador de 20 por página en Descubrir y Trama. |
| V GMM 0007 | 2026-07-28 | Descubrir traía más de una página de `/discover`. Sustituido en la 0008 por el paginador. |
| V GMM 0006 | 2026-07-28 | Interruptor global Película/Serie y dos formas de buscar separadas; las series entran en las cuatro búsquedas. |
| V GMM 0005 | 2026-07-28 | Modo «Descubrir por género» y entrada de las series, con la capa de datos consciente del tipo. |
| V GMM 0004 | 2026-07-28 | Publicada en GitHub Pages; el cargador de la clave local solo se pide cuando corre en local. |
| V GMM 0003 | 2026-07-28 | Aplicación instalable (PWA): manifiesto, service worker, iconos y la suite `pruebas/pwa.js`. |
| V GMM 0002 | 2026-07-27 | Distinguir «no está en ninguna parte» de «está, pero no en la plataforma que filtraste». |
| V GMM 0001 | 2026-07-27 | Versión inicial: tres modos de búsqueda, filtros, deducción de idioma por mercado, listas y modo demo. |
