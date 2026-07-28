# givemymovies

Buscador que responde a una pregunta concreta: **¿dónde puedo ver esta película, y en mi idioma?**

Buscas por título, por actor o actriz, o por la trama que recuerdas, y te dice en qué plataformas
y en qué países está disponible, con la carátula y un resumen en lenguaje natural:

> **Interestelar** en español la puedes ver en **Netflix** (Argentina, Chile y México),
> **Max** (Argentina, Chile y Colombia), **Movistar Plus+** (España) y **SkyShowtime** (España).

---

## Cómo se usa

Haz doble clic en `index.html`. No hace falta servidor, ni Node, ni instalar nada.

Arranca en **modo demo**, con un catálogo de ocho películas de ejemplo, para que puedas
probarlo todo desde el primer segundo.

### Para tener datos reales

El modo demo solo conoce esas ocho películas. Para acceder a las de verdad —más de 90 países
y cientos de plataformas, actualizado a diario— necesitas una clave gratuita de TMDB:

1. Crea una cuenta en [themoviedb.org](https://www.themoviedb.org/signup).
2. Entra en **Ajustes → API** y solicita una clave de uso personal.
3. Copia la **API Key (v3 auth)**.
4. En la app, pulsa el engranaje ⚙ y pégala. Se guarda en tu navegador.

La pastilla de la cabecera pasa de *Modo demo* a *Datos en vivo*.

> La clave se guarda en `localStorage`, así que solo existe en tu navegador. Si algún día
> publicas esta web en internet, cualquiera podría leerla en el código: para eso haría falta
> un pequeño servidor intermedio que la guarde.

---

## Los tres modos de búsqueda

| Modo | Qué hace |
|---|---|
| **Película** | Busca por título y muestra su ficha con todos los países donde está. |
| **Actor / Actriz** | Muestra su filmografía; el botón *¿Dónde puedo ver sus películas?* consulta la disponibilidad de los 24 títulos más populares. |
| **Trama / Tema** | Busca por concepto ("viajes en el tiempo", "atraco") usando las palabras clave de TMDB. |

Los filtros de **plataforma** y **país** son opcionales. Al cambiarlos, el resultado se
recalcula al instante sin volver a consultar la API.

---

## Mis listas

Dos listas independientes, guardadas en el navegador:

- ♥ **Favoritas** — las que te encantan.
- 🔖 **Pendientes de ver** — las que tienes en cola.

Una película puede estar en las dos. Desde la vista de listas, el botón
**¿Dónde puedo verlas ahora?** recorre tus pendientes y te dice cuáles están disponibles
hoy con tus filtros de idioma y plataforma.

Como viven solo en este navegador, en ⚙ tienes **Exportar** e **Importar** para hacer copia.

---

## Sobre el idioma: léelo, importa

**Ninguna API pública dice en qué idiomas está una película en una plataforma concreta.**
TMDB usa los datos de JustWatch, que informan del *país* y de la *plataforma*, pero nunca
de las pistas de audio o subtítulos de esa ficha.

Así que givemymovies lo deduce del mercado, y te lo dice abiertamente:

| Insignia | Qué significa |
|---|---|
| **Audio original** | El idioma que buscas es el original de la película, y el país lo sirve. |
| **Doblada y subtitulada** | El idioma que buscas es el principal de ese mercado (español en Argentina, México, España…). |
| **Idioma cooficial del mercado** | El país sirve ese idioma, pero no es el principal (español en Estados Unidos, francés en Canadá). |

Los países que no encajan se ocultan, con un botón para verlos igualmente.
**Confirma siempre en la plataforma antes de darle al play.**

---

## Estructura del archivo

Todo vive en `index.html`, dividido en bloques marcados con banners de comentario.
Cada banner indica a qué archivo correspondería si algún día quieres separarlo:

**CSS** (dentro de `<style>`)

| Bloque | Destino sugerido |
|---|---|
| 1 · Reset y base | `css/base.css` |
| 2 · Cabecera | `css/header.css` |
| 3 · Buscador y filtros | `css/buscador.css` |
| 4 · Resultados | `css/resultados.css` |
| 5 · Modales y avisos | `css/modales.css` |
| 6 · Responsive | `css/responsive.css` |

**JavaScript** (dentro de `<script>`)

| Bloque | Destino sugerido | Responsabilidad |
|---|---|---|
| 1 · Configuración | `js/config.js` | Constantes y claves de almacenamiento |
| 2 · Mapas de país e idioma | `js/datos.js` | Qué idiomas sirve cada mercado |
| 3 · Catálogo de demo | `js/demo.js` | Datos de ejemplo sin clave |
| 4 · Utilidades | `js/util.js` | Escapado, lotes, retardos |
| 5 · Acceso a TMDB | `js/tmdb.js` | Peticiones y caché |
| 6 · Lógica de idioma | `js/idioma.js` | Filtrado y frase resumen |
| 7 · Mis listas | `js/listas.js` | Favoritas y pendientes |
| 8 · Interfaz | `js/ui.js` | Pintado de componentes |
| 9 · Aplicación | `js/app.js` | Vistas, eventos y arranque |

Para separarlos: corta cada bloque a su archivo y enlázalos en este orden con etiquetas
`<script src="...">` normales. Cada bloque cuelga de un objeto global (`GMM.tmdb`,
`GMM.ui`…), así que **no hay que tocar ni una línea de código** para que siga funcionando.

---

## Límites conocidos

- **Precios de alquiler y compra**: TMDB no los publica. Haría falta la API de pago de JustWatch.
- **Búsqueda por trama**: TMDB no busca dentro del texto de la sinopsis. Se usa su sistema
  de palabras clave, que funciona bien con conceptos pero no con frases largas.
- **Solo películas**: las series aún no están (es la primera mejora de la lista).
- **Filmografías largas**: se consultan los 24 títulos más populares, para no disparar
  cientos de peticiones.

---

## Ideas para más adelante

1. **Series además de películas** — misma API, duplica el alcance. La más rentable.
2. **Enlace compartible** — codificar la búsqueda en la URL.
3. **Avísame cuando llegue** — vigilar un título hasta que aparezca en tu país (necesita servidor).
4. **Tráiler incrustado** — un clic sin salir de la app.
5. **Comparador de países** — útil para quien usa VPN.
6. **Sorpréndeme** — película al azar que cumpla tus filtros.
7. **Filtros avanzados** — género, año, nota mínima, duración.
8. **PWA instalable** — icono en el móvil y caché de las últimas búsquedas.

---

Datos de películas y disponibilidad: [TMDB](https://www.themoviedb.org) / JustWatch.
Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
