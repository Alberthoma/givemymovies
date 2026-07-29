# PROMPT MAESTRO — givemymovies

**Documento v1.15 · Aplicación V GMM 0015 · 28 de julio de 2026**
**Publicada en:** <https://alberthoma.github.io/givemymovies/>

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
| R1 | **Un único `index.html`** | HTML, CSS y JavaScript en el mismo archivo. Debe abrirse con doble clic, sin servidor, sin build, sin instalación. **Única excepción:** `manifest.json`, `sw.js` e `iconos/`, que han de ser archivos aparte por definición para que la app sea instalable (§5.8). Ninguna lógica de la app vive en ellos. |
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

**5.1.1 Un interruptor y dos formas de buscar.** Arriba, un **interruptor global
Película / Serie** decide el tipo de todo lo que se busca. Debajo, un selector de **método**
con dos opciones:

Los dos métodos son **dos botones sueltos, en una misma fila, centrados y debajo** del
interruptor (sin caja ni pastilla segmentada que los envuelva). El **seleccionado se tiñe con
el color sólido del tipo y lleva un halo** de iluminación alrededor (box-shadow del color).

- **Buscar una en concreto:** un **desplegable** elige *por título · por actor/actriz · por
  trama*, con el campo de texto y el autocompletado. Cambiar la forma limpia el campo y los
  resultados y ajusta el ejemplo del campo y los chips.
- **Descubrir por género:** oculta el campo de texto; muestra los controles de §5.4b.

Buscar «dónde la veo» y «descubrir por género» son intenciones distintas y no deben
mezclarse en una misma fila de pestañas: por eso van en métodos separados, y el tipo
(peli/serie) es un interruptor aparte que manda sobre los dos.

**Dos pantallas (desde V GMM 0009).** El buscador **no es una caja**: son controles sueltos y
**centrados**. Hay una pantalla de búsqueda (formulario visible) y una de resultados
(formulario **oculto**, con una flecha **←** para volver): al buscar se ve header + flecha +
resultado, sin pasar por el formulario. Los filtros de idioma, plataforma y país se eligen
**antes** de buscar; al haber resultados no se ven, así que ya no se refinan en vivo (se cambia
con ← y buscar otra vez). Lo alterna `fijarPantalla()` según `estado.vista`.

**El interruptor peli/serie afecta a las cuatro búsquedas** (título, actor, trama y
descubrir) y **solo tiñe sus propios acentos**: el propio interruptor (Series azul a la
izquierda, Películas naranja a la derecha), el método activo y el botón *Buscar*. El resto de
la paleta —fondo, tarjetas, sellos de confianza— no cambia (§6).

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

Los tres filtros se eligen **en la pantalla de búsqueda, antes de buscar** (desde V GMM 0009
el resultado oculta el formulario, §5.1.1). El resultado ya llega filtrado por ellos; para
cambiarlos se vuelve con ← y se busca de nuevo. La lógica de filtrado (`GMM.idioma.filtrar`)
sigue trabajando sobre los datos ya en memoria, sin nuevas llamadas a la API.

**5.1.4 Chips de ejemplo** bajo el campo, distintos según la forma de búsqueda. Al pulsarlos, buscan.

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

**Casos sin resultado. Distínguelos: decir *por qué* no hay nada es la mitad del valor de la
app.** Un «sin resultados» a secas es cierto e inútil. Se comprueban en este orden:

| # | Situación | Texto | Salida ofrecida |
|---|---|---|---|
| 1 | Está disponible, pero **no en la plataforma filtrada** | «*{Título}* sí está disponible en N países, pero **no en {plataforma}**. Quita el filtro de plataforma para ver dónde.» | Botón *Ver todas las plataformas* |
| 2 | Está en otros países, pero **ninguno sirve ese idioma** | «*{Título}* está disponible en N países, pero en ninguno cuyo catálogo se sirva en {idioma}.» | Botón *Ver los N países igualmente* |
| 3 | **No está en ninguna parte** con esos filtros | «No encontramos *{Título}* en {idioma} en ninguna plataforma con estos filtros.» | — |

Para el caso 1, `filtrar()` debe devolver **`descartadosPorPlataforma`**: los países que tienen
alguna oferta pero la pierden al aplicar el filtro de plataforma. Sin ese contador, los casos 1
y 3 son indistinguibles.

**2 · Ficha.** Imagen de fondo difuminada, carátula, título, título original si difiere, año,
duración, nota, idioma original y sinopsis. Debajo, **«También conocida como»**: los títulos
alternativos por país (campo `alternative_titles` de TMDB, pedido con `append_to_response`),
filtrados a los mercados en español más el inglés y agrupados por título distinto
(`GMM.util.titulosAlternativos`). Ej.: *Duro de matar* muestra «La jungla de cristal (España)».

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

### 5.4b Método: «Descubrir por género»

No se busca un título: se **descubre por criterios**. El tipo (peli/serie) lo manda el
interruptor global (§5.1.1); aquí van cuatro selectores y una fila de orden:

| Control | Obligatorio | Contenido |
|---|---|---|
| **Género** | No | «Cualquier género» + la taxonomía de TMDB. **Depende del interruptor**: cine y series usan listas distintas (`GMM.datos.GENEROS_PELICULA` / `GENEROS_SERIE`), así que al cambiar el tipo hay que reconstruir el desplegable |
| **Desde** | No | «Cualquier año» + años de hoy hacia atrás |
| **Hasta** | No | Ídem. Los dos forman un **intervalo**; si se eligen del revés, **enderézalo solo** y avisa, en vez de devolver una lista vacía sin explicación |
| **Calificación** | No | «Cualquier nota» + `N o más`, con la nota de TMDB (0–10) |

**Ordenar por** — tres interruptores que se encienden y apagan, no un desplegable:

| Interruptor | Regla |
|---|---|
| **Más recientes** | Excluyente con *Más antiguas*: una lista no puede ir en los dos sentidos |
| **Más antiguas** | Ídem |
| **Mayor puntuación** | **Se combina** con cualquiera de los dos, o va sola |

Con ninguno encendido, el orden es por popularidad. Volver a pulsar el que ya está encendido
lo apaga.

```
1. Con clave: /discover/movie o /discover/tv, con
   with_genres, vote_average.gte, sort_by (según el orden), y el intervalo por
   primary_release_date.gte/.lte (first_air_date.* en series).
   vote_count.gte = 40 normal, 300 al ordenar por nota.
2. Sin clave (demo): filtra el catálogo de ejemplo por género, intervalo y nota,
   y lo ordena con el mismo criterio, combinación incluida.
3. Normaliza cada resultado con su tipo antes de pintar (§8).
```

**Corta siempre en la fecha de hoy** (`…date.lte`). Sin ese corte, ordenar por fecha
descendente llena la primera página de películas **sin estrenar**: no hay dónde verlas, que
es justo la pregunta que responde la app.

**Ordenar por fecha y por nota a la vez.** `sort_by` de TMDB admite **una sola clave**, así
que la combinación no se resuelve con una consulta. Tampoco vale reordenar por nota la página
ya traída: esos 20 títulos son solo los 20 primeros según *un* criterio, y reordenarlos
produce una lista que **parece** lo pedido sin serlo —los mejores del año pueden estar en la
página 8—. Recorre los años uno a uno y pídele a cada año su propia lista ordenada por nota:

```
reciente + nota → año 2026 ordenado por nota, luego 2025 por nota, luego 2024…
antigua  + nota → igual, empezando por el año más antiguo del intervalo.
```

Sigue costando **una petición por página**, porque los años se piden según se avanza. Los
años sin resultados se saltan solos, con un tope de años vacíos consecutivos
(`MAX_ANOS_VACIOS`) para no encadenar peticiones inútiles; **sin clave ese tope no aplica**,
porque el catálogo de ejemplo se filtra en memoria.

Muestra los resultados en la misma cuadrícula que el modo trama, **paginada**: `/discover`
devuelve **20 por página**, y debajo (y encima) de la rejilla va un paginador
**← Anterior · Página X de N · Siguiente →** que recorre todas las páginas que tenga TMDB
(`total_pages`, topado a `MAX_PAGINAS` = 500). `descubrir(tipo, opciones, pagina)` y
`buscarPorTrama(texto, tipo, pagina)` devuelven `{ items, pagina, total }`; la app recuerda
el contexto en `estado.ctxPagina` y `irAPagina(n)` rehace solo esa página.

**En el recorrido por años el paginador cambia**, porque no existe un total global: en vez de
«Página 3 de 40» dice **«2026 · página 3 de 5»**, y *Siguiente* salta al año siguiente con
resultados cuando se agota el actual. Solo se puede ir a una página ya vista o a la
inmediatamente siguiente. Cuando se acaba el intervalo, dilo («no hay más resultados») y
quédate donde estabas, no vacíes la pantalla.

Cambiar cualquier criterio vuelve a la página 1 y reinicia el recorrido. Los géneros **no se
piden a la API**: son una taxonomía estable y se guardan en `GMM.datos`.

**El subtítulo del resultado dice siempre cómo está ordenada la lista** («año a año, del más
reciente, y las mejor puntuadas de cada año primero»). Nadie debería tener que adivinar por
qué esa película va la primera.

**Cambiar cualquiera de los controles vuelve a descubrir al instante** si ya hay resultados en
pantalla, igual que los filtros de plataforma/país/idioma recalculan sin pedir de nuevo. La
primera búsqueda la lanza el botón *Buscar*.

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

### 5.7 Aplicación instalable en el móvil

La app debe poder instalarse en un teléfono, con su icono y a pantalla completa.

**Archivos** (la excepción a R1):

| Archivo | Contenido |
|---|---|
| `manifest.json` | `display: standalone`, colores `#0b0f14`, iconos de 192, 512 y uno *maskable*. **`start_url` y `scope` relativos (`./`)**: en GitHub Pages el sitio cuelga de un subdirectorio, no de la raíz del dominio |
| `sw.js` | Service worker |
| `iconos/` | `icono.svg` como origen, los PNG generados y `generar.js` para rehacerlos con Playwright |

**Estrategia de caché. El primer punto no es negociable:**

| Recurso | Estrategia | Razón |
|---|---|---|
| `api.themoviedb.org` | **Solo red. Nunca caché** | La disponibilidad cambia. Servirla rancia convertiría la app en un engaño, que es justo lo contrario de lo que define este proyecto (§4.3) |
| `image.tmdb.org` | Caché primero, tope de 300 | Una carátula nunca cambia para una misma URL |
| Abrir la app | Red primero, caché de reserva | Las versiones nuevas llegan solas; sin conexión sigue abriendo |
| Iconos y manifiesto | Caché primero | No cambian entre versiones |

**Al publicar una versión que toque el código, sube `VERSION` en `sw.js`.** Si no, quien ya
tenga la app cacheada seguirá viendo la vieja indefinidamente.

**Botón *Instalar*** en la cabecera, oculto por defecto. Aparece solo cuando el navegador
dispara `beforeinstallprompt`, para no prometer lo que no se puede cumplir. Safari en iPhone
nunca lo dispara: allí se instala desde *Compartir → Añadir a pantalla de inicio*.

**Todo esto exige HTTPS.** Al abrir el archivo con doble clic la app funciona igual de bien,
simplemente no se instala ni cachea. Detéctalo y no registres nada en ese caso, en vez de
dejar que falle.

### 5.8 Estados y errores

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

- **La cabecera es una tira de rollo de película**: cuerpo oscuro con bordes redondeados y
  dos bandas de perforaciones (arriba y abajo), dibujadas con un SVG en línea repetido en
  `::before` / `::after` —sin imágenes externas—. Es solo el envoltorio: dentro va el mismo
  contenido de siempre (marca, pastilla de modo, contador de listas, *Instalar*, ajustes).
- **El interruptor Película / Serie tiñe solo sus acentos**, no toda la app: Películas =
  naranja (`#ff8a3d`), Series = azul (`#4aa8ff`). Se aplica al propio interruptor, al método
  activo y al botón *Buscar* (vía `#buscador[data-tipo="…"]`). El fondo, las tarjetas y los
  sellos de confianza (que usan el verde con su propio significado) no cambian. Nada de rojo:
  se mantiene la paleta de verdes, naranjas y azules.
- **El estado de datos es un punto**, no una pastilla con texto: verde = datos en vivo,
  naranja = modo demo, arriba a la derecha del header (con `title`/`aria-label` para leerlo).
- **El buscador no es un panel con caja**: sin fondo ni borde, controles centrados. El título
  y el interruptor van centrados; los campos y filtros, en una columna centrada de ancho
  cómodo. En móvil el título va **a una sola línea** (fuente más pequeña, `white-space: nowrap`).
- **Al haber resultados el formulario se oculta** y aparece una **flecha ← para volver**;
  quedan a la vista header + flecha + resultado. La cuadrícula de resultados es de **2 columnas
  en móvil** y el paginador lleva **Anterior y Siguiente en una fila**.
- **El header es bajo y fijo** (`position: sticky; top: 0`, z-index 50 por debajo de modales
  y avisos): la cabecera queda pegada arriba al hacer scroll, con su fondo sólido tapando lo
  que pasa por debajo. A la izquierda la marca (icono + texto), a la derecha el punto de estado
  (arriba a la derecha, con `align-self: flex-start`), en la misma línea. **Mis listas**, **Instalar** y **⚙ Ajustes** no van en el
  header, sino en una barra justo debajo, alineada a la derecha (el ⚙ a la derecha de Mis listas).
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
| Buscar título | `/search/movie` · `/search/tv` (según el interruptor) |
| Buscar persona | `/search/person` |
| Filmografía | `/person/{id}/movie_credits` · `/person/{id}/tv_credits` |
| Ficha película / serie | `/movie/{id}` · `/tv/{id}` (con `append_to_response=alternative_titles`) |
| **Dónde verla** | `/movie/{id}/watch/providers` · `/tv/{id}/watch/providers` ← el dato central |
| Trama | `/search/keyword` → `/discover/movie?with_keywords=` · `/discover/tv?with_keywords=` |
| Descubrir por género | `/discover/movie` · `/discover/tv` con `with_genres`, `primary_release_year` / `first_air_date_year`, `vote_average.gte` |
| Catálogo de plataformas | `/watch/providers/movie` |

Todas con `language=es-ES`. Caché en memoria por ruta + parámetros.

**Normaliza películas y series a una forma común.** TMDB usa `name` / `first_air_date` /
`episode_run_time` para series y `title` / `release_date` / `runtime` para películas.
`GMM.util.normalizarMedia(item, tipo)` copia los campos de serie a los de película y marca
`tipo: "movie" | "tv"`, de modo que el resto del código no distingue unos de otras. **Indexa
la caché de disponibilidad y las listas por `"tipo:id"`**, no por id: una peli y una serie
pueden compartir id numérico y una lista de pendientes puede mezclar ambas.

**Géneros como taxonomía fija.** Son estables; guárdalos en `GMM.datos.GENEROS_PELICULA` y
`GMM.datos.GENEROS_SERIE` en vez de pedirlos a `/genre`. Ahorra una llamada y funciona igual
en demo que en vivo.

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
otros que no lo son, y alguno cuyo idioma original no sea el inglés. Cada película lleva
`genre_ids` para que Descubrir funcione sin clave. **Añade también unas pocas series de
ejemplo** (tres, con idiomas distintos) para poder demostrar Descubrir con series. Van **sin
carátula** a propósito: no siempre se puede verificar que una imagen pertenece de verdad a la
ficha (§10), y es preferible la reserva con el título a arriesgar una imagen equivocada.

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
node pruebas/pwa.js         # levanta un servidor local y comprueba la instalabilidad
```

`pwa.js` necesita servir la app por HTTP porque los service workers no existen sobre
`file://`. `localhost` cuenta como origen seguro igual que HTTPS, así que basta un servidor
mínimo de Node, sin dependencias añadidas.

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
| A3 | Plataforma `Netflix` elegida antes de buscar | El resultado se reduce a Argentina, Chile y México (los filtros se aplican al buscar, no en vivo, desde V GMM 0009) |
| A4 | Idioma `japonés` | **Solo Japón** — es su mercado, debe aparecer |
| A5 | Idioma `árabe` | Ningún país; aviso de que está en 10 pero ninguno lo sirve, con salida |
| A6 | «Ver todos los países» | Aparecen los 10; el botón inverso vuelve a 6 |
| A7 | Guardar en listas | El contador sube, el botón cambia de texto, **sobrevive a recargar** |
| A8 | Modo actor | Filmografía visible y barra de progreso completándose hasta «Listo: N de M» |
| A9 | Modal de detalle | Abre, trae países, cierra con `Escape` |
| A10 | Autocompletado tras buscar | **No reaparece** encima de los filtros |
| A11 | Ancho de 375 px | Cero desbordamiento horizontal |
| A12 | Toda la sesión | **Cero errores de JavaScript en consola** |
| A13 | Película que existe pero no en la plataforma filtrada | La frase nombra la plataforma que falla y dice en cuántos países **sí** está; botón que quita el filtro |
| A14 | Sin filtro de plataforma | `descartadosPorPlataforma` vale 0; no se inventa el caso |
| A15 | Servida por HTTPS o `localhost` | El service worker se registra y queda activo; precachea el esqueleto |
| A16 | Tras cargar la app | **Ninguna respuesta de `api.themoviedb.org` en la caché** |
| A17 | Sin conexión | La app sigue abriendo y el buscador se ve |
| A18 | Manifiesto | `start_url` y `scope` relativos; iconos de 192, 512 y *maskable*, PNG reales |
| A19 | Abierta con doble clic (`file://`) | No intenta registrar el service worker ni deja errores en consola |
| A20 | Modo `¿Qué quieres ver?` | Se oculta el campo de texto y los chips; aparecen tipo, género, año y calificación |
| A21 | Series · Drama · nota 6 o más (demo) | Cuadrícula con las series de drama de nota ≥ 6, ordenadas por nota |
| A22 | Cambiar el tipo de Películas a Series | El desplegable de género se reconstruye con la taxonomía de series |
| A23 | Normalización | Una serie cruda (`name`/`first_air_date`/`episode_run_time`) queda con `title`/`release_date`/`runtime` y `tipo:"tv"`, sin mutar el original |
| A24 | Peli y serie con el mismo id en listas | Guardar una no borra la otra; quitar una deja la otra (listas y `disponibilidad` indexan por `tipo:id`) |
| A25 | Interruptor a Series | `#buscador` queda con `data-tipo="tv"`, la opción Series activa, el ejemplo del campo cambia a series y los acentos pasan a azul |
| A26 | Serie por título (demo) | Con el interruptor en Series y buscar por título, «casa» encuentra *La casa de papel* |
| A27 | Descubrir con Series | En «Descubrir por género» no hay selector de tipo; el interruptor manda, y Drama devuelve las series de drama |
| A28 | Método «Descubrir» | Oculta el campo de texto y los chips; «Buscar una en concreto» los devuelve |
| A29 | Paginador (Descubrir/Trama) | Con varias páginas aparece ← Anterior · Página X de N · Siguiente →; *Siguiente* avanza de página y *Anterior* está deshabilitado en la página 1 |
| A30 | Estado de datos | Es un punto (no texto): naranja en demo, verde con clave; con `title` legible |
| A31 | Modo resultados | Al haber resultados el formulario se oculta y aparece la flecha ←; pulsarla vuelve a la pantalla de búsqueda |
| A32 | Móvil | El título cabe en una línea; la cuadrícula va a 2 columnas; sin desbordamiento horizontal |
| A33 | Mis listas | El botón vive en una barra bajo el header (no dentro), y su vista sigue funcionando |
| A34 | Títulos alternativos | En la ficha, «También conocida como» lista los títulos por país (mercados es + en), sin repetir el título principal ni el original; `GMM.util.titulosAlternativos` los agrupa |
| A35 | Interruptores de orden | Arrancan apagados; *Más antiguas* apaga a *Más recientes* y viceversa; *Mayor puntuación* se suma sin sustituir; volver a pulsar el encendido lo apaga |
| A36 | Intervalo del revés | Elegir *Desde* 2021 y *Hasta* 2015 lo endereza solo a 2015–2021 y lo avisa; el título del resultado dice «de 2015 a 2021» |
| A37 | Año y nota a la vez | El paginador dice «AAAA · página X de N»; *Siguiente* salta a un año **anterior** (o posterior, si es *Más antiguas*) con resultados, y el subtítulo explica «año a año…» |
| A38 | Orden por fecha descendente | Ningún resultado con fecha de estreno **posterior a hoy** |
| A39 | Orden por nota (datos reales) | La cabeza de la lista de drama son títulos conocidos (*Cadena perpetua*, *El padrino*), no un 9,9 con 143 votos: `vote_count.gte` = 300 al ordenar por nota |
| A40 | Sin orden elegido | Se comporta exactamente como antes de la 0015: por popularidad |

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
| `manifest.json`, `sw.js`, `iconos/` | Lo que hace la app instalable en el móvil (§5.7) |
| `pruebas/` | `cargar.js`, `logica.js`, `imagenes.js`, `interfaz.js`, `pwa.js`, `clave.js`, `LEEME.md` |
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
- **Puntuaciones de IMDb y Rotten Tomatoes**: no están. TMDB no las publica; traerlas
  exigiría OMDb con su propia clave. La calificación de Descubrir es la de TMDB.
- **Filmografías**: se consultan los 24 títulos más populares, no la obra completa.
- **La clave viaja al navegador**: publicar la web exigiría un servidor intermedio.
- **El idioma es una estimación**, nunca un dato confirmado (§4.3).

---

## 13. Mejoras futuras, por valor

1. **Login y sincronización de las listas.** Hoy `gmm_listas` vive en `localStorage`, que es
   por navegador: la lista del móvil y la del PC son dos listas distintas. Necesita login
   —acceso con Google es lo más liviano en móvil— y un almacén en la nube. **La app debe
   seguir funcionando sin identificarse:** iniciar sesión añade sincronización, no la
   condiciona. **Cuidado con R3:** el SDK de Firebase es una librería; su API REST permite
   hacerlo con `fetch` a pelo y conservar la regla. Ver `CLAUDE.md` §11.2.
2. **Puntuaciones de IMDb y Rotten Tomatoes.** TMDB no las da; requeriría OMDb con su propia
   clave. Se planteó y se aparcó (ver §15 y `CLAUDE.md`).
3. **Enlace compartible.** Codificar la búsqueda en la URL.
4. **Avísame cuando llegue.** Vigilar un título hasta que aparezca en tu país. Necesita servidor.
5. **Tráiler incrustado.** `/movie/{id}/videos`, un clic sin salir de la app.
6. **Precios de alquiler y compra.** TMDB no los publica; requiere la API de pago de JustWatch.
7. **Comparador de países.** Útil para quien usa VPN.
8. **Sorpréndeme.** Película o serie al azar que cumpla los filtros activos.

*(La PWA instalable está hecha desde V GMM 0003 (§5.7). «Mi lista» se implementó en
V GMM 0001. Los filtros de género, año y nota y las series llegaron en V GMM 0005; el
interruptor Película/Serie con series en **todas** las búsquedas, en V GMM 0006 (§5.1.1);
el **orden** de Descubrir y el **intervalo de años**, en V GMM 0015 (§5.4b).)*

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
| 1.15 | V GMM 0015 | 28-07-2026 | Descubrir se ordena (§5.4b): tres interruptores —*Más recientes*, *Más antiguas* (excluyentes) y *Mayor puntuación* (combinable)— y el «Año» exacto pasa a **intervalo desde–hasta**, que se endereza solo si se elige del revés. Como `sort_by` de TMDB admite una sola clave, **año + nota se resuelve recorriendo los años uno a uno**, a una petición por página, y el paginador pasa a decir «AAAA · página X de N». Todas las consultas cortan en la fecha de hoy (fuera estrenos futuros) y ordenar por nota exige `vote_count.gte` = 300, medido contra la API real. Criterios A35–A40. `logica.js` 92→106, `interfaz.js` 59→72. |
| 1.14 | V GMM 0014 | 28-07-2026 | Arreglo: el modal de detalle se limita a la altura de la pantalla y su cuerpo hace scroll interno (cabecera y pie fijos), para que en móvil el contenido de abajo no quede cortado. |
| 1.13 | V GMM 0013 | 28-07-2026 | Ficha: sección «También conocida como» con los títulos alternativos por país (§5.2), vía `append_to_response=alternative_titles` y `GMM.util.titulosAlternativos` (mercados es + en). Criterio A34. `logica.js` 86→92. |
| 1.12 | V GMM 0012 | 28-07-2026 | Header fijo con `position: sticky; top: 0` (z-index 50), pegado arriba al hacer scroll (§6). |
| 1.11 | V GMM 0011 | 28-07-2026 | Métodos en una fila (también en móvil), con el seleccionado tinte sólido + halo (§5.1.1). El punto de estado en la misma línea que la marca; **⚙ Ajustes** e **Instalar** salen del header a la barra de Mis listas; header más bajo (§6). |
| 1.10 | V GMM 0010 | 28-07-2026 | Los métodos «Buscar una en concreto» / «Descubrir por género» dejan de ir en un contenedor y quedan como dos botones sueltos, centrados y debajo del interruptor (§5.1.1). |
| 1.9 | V GMM 0009 | 28-07-2026 | Rediseño de disposición (§5.1.1, §6): buscador **sin caja y centrado**; estado de datos como **punto** (verde/naranja); **Mis listas** sale del header a una barra debajo; **dos pantallas** (al haber resultados el formulario se oculta y aparece la flecha **←**, `fijarPantalla`); cuadrícula a **2 columnas** en móvil; paginador con **Anterior/Siguiente en una fila**; título a **una línea** en móvil. Los filtros se eligen antes de buscar (§5.1.3, A3). Criterios A30–A33. `interfaz.js` 58→59. |
| 1.8 | V GMM 0008 | 28-07-2026 | **Paginador** en Descubrir y Trama (§5.4b): 20 por página con controles ← Anterior · Página X de N · Siguiente →, que recorre todas las páginas de TMDB. `descubrir`/`buscarPorTrama` devuelven `{items, pagina, total}`; `estado.ctxPagina` + `irAPagina`. Sustituye el volcado de la 0007. |
| 1.7 | V GMM 0007 | 28-07-2026 | Descubrir traía más de una página de `/discover` de golpe. Sustituido en 0008 por un paginador con controles. |
| 1.6 | V GMM 0006 | 28-07-2026 | Buscador reestructurado (§5.1.1): **interruptor global Película/Serie** —solo tiñe sus acentos, naranja/azul, sin rojo (§6)— y **dos métodos separados**, «buscar una en concreto» (desplegable título/actor/trama) y «descubrir por género». El interruptor manda en las **cuatro búsquedas**: serie por título (`/search/tv`), filmografía en TV (`/person/{id}/tv_credits`) y trama en series (`/discover/tv` con keywords). El selector «Tipo» sale de Descubrir (§5.4b): lo lleva el interruptor. Criterios A25–A28. |
| 1.5 | V GMM 0005 | 28-07-2026 | Nuevo modo **¿Qué quieres ver?** (§5.4b): descubrir por tipo (película/serie), género, año y nota de TMDB, con `/discover/movie` y `/discover/tv`. Entran las **series**, con la capa de datos normalizada por tipo y las listas/`disponibilidad` indexadas por `tipo:id` (§8). Géneros como taxonomía fija en `GMM.datos`. Cabecera rediseñada como **tira de rollo de película** (§6), solo aspecto. Series de la demo sin carátula, por no poder verificar la imagen. Criterios A20–A24. Se aparcan las puntuaciones de IMDb/Rotten Tomatoes: TMDB no las da y traerlas exigiría OMDb con otra clave. |
| 1.4 | V GMM 0004 | 28-07-2026 | Publicada en GitHub Pages y verificada contra el sitio real desde un navegador móvil. La clave local se carga solo cuando la app corre en local, para no dejar un 404 en la consola del sitio publicado. |
| 1.3 | V GMM 0003 | 28-07-2026 | Nueva §5.7: la app es instalable en el móvil. Manifiesto, service worker con su estrategia de caché razonada, iconos y botón de instalar. R1 gana su única excepción documentada. Criterios A15–A19. La PWA sale de las mejoras propuestas de §13 porque ya está hecha. |
| 1.2 | V GMM 0002 | 27-07-2026 | §5.2 distingue ahora tres casos sin resultado en lugar de dos: el nuevo es «está disponible, pero no en la plataforma que filtraste», con su contador `descartadosPorPlataforma` y su botón de salida. Criterios A13 y A14. Lo destapó una búsqueda real del usuario. |
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
