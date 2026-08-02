# givemymovies

Buscador que responde a una pregunta concreta: **¿dónde puedo ver esta película, y en mi idioma?**

Buscas por título, por actor o actriz, o por la trama que recuerdas, y te dice en qué plataformas
y en qué países está disponible, con la carátula y un resumen en lenguaje natural:

> **Interestelar** en español la puedes ver en **Netflix** (Argentina, Chile y México),
> **Max** (Argentina, Chile y Colombia), **Movistar Plus+** (España) y **SkyShowtime** (España).

---

## Cómo se usa

Haz doble clic en `index.html`. No hace falta servidor, ni Node, ni instalar nada.

### En el móvil

Una vez publicada la web (GitHub Pages), la app se **instala como una aplicación normal**:
icono en la pantalla de inicio, pantalla completa, sin barra del navegador.

| Sistema | Cómo |
|---|---|
| **Android** | Aparece el botón **Instalar** en la cabecera. También sale solo un aviso del navegador |
| **iPhone** | Safari no ofrece botón: usa **Compartir → Añadir a pantalla de inicio** |

Una vez instalada funciona **sin conexión** para todo menos consultar dónde ver una película,
que por definición necesita internet. Los datos de disponibilidad **nunca se guardan**: una
película que ayer estaba en Netflix hoy puede no estarlo, y enseñarte datos viejos sería
peor que no enseñarte nada.

En el móvil tendrás que pegar tu clave de TMDB una vez, en el ⚙. Se queda guardada en ese
teléfono para siempre.

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

### Notas de IMDb, Rotten Tomatoes y Metacritic (opcional)

La ficha muestra la nota de TMDB. Si además quieres las de **IMDb, Rotten Tomatoes y
Metacritic**, hace falta una segunda clave gratuita, la de **OMDb**. Es **opcional**: sin ella
la app funciona exactamente igual, solo que no verás esas notas.

1. Pídela en [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx), plan **FREE!** (1.000 consultas al día).
2. **Activa** la clave desde el enlace que te llega al correo (si no, no funciona).
3. En la app, en el ⚙, pégala en el campo **Clave de OMDb** y guarda.

Las notas aparecen en la ficha y en el detalle, no en las cuadrículas de descubrimiento.

---

## Los carruseles de sugerencias (¿y qué veo?)

Nada más abrir, bajo el header, hay **cinco carruseles deslizables** para cuando no buscas nada
en concreto — uno por categoría, con **20 títulos cada uno**:

| Categoría | Qué trae |
|---|---|
| **Tendencia** | Lo más visto de la semana. |
| **Las 20 de siempre** | Las 20 mejores de 2000 en adelante. |
| **Nunca es tarde** | Las 20 mejores de 1980 a 2000. |
| **Clásicos** | Las 20 mejores de 1950 a 1979. |
| **Lo que prefieres** | Tu lista de favoritas. |

Cada carátula lleva su **nota de TMDB** en la esquina, que es además la que ordena la lista: lo
que ves arriba es lo mejor puntuado. Los carruseles **respetan el interruptor Película / Serie**,
y al tocar una carátula se abre su ficha de dónde verla. Desliza con el dedo en el móvil o con
las flechas ‹ › en el ordenador, que son **infinitas**: al llegar al final vuelven al principio,
y al revés.

En «Las 20 de siempre», «Nunca es tarde» y «Clásicos» aparece además un botón **«Ver más»**:
abre la **cuadrícula completa del periodo** (con nota de TMDB de 6 o más), de la más antigua a la
más reciente, **20 carátulas por página** y un paginador corriente —«Página 1 de 30»—. Desde ahí
puedes reordenarla sin volver atrás, con el botón **Ordenar** que hay junto a la flecha ←.

---

## Cómo se busca

Arriba hay un **interruptor Película / Serie** (naranja / azul) que decide qué estás
buscando. Debajo, **dos formas de llegar al mismo resultado —dónde verla—**, cada una en su
botón. Al pulsar uno se abre una **ventana con su formulario**: los campos van de dos en dos,
con la **✕** arriba a la derecha para cerrar y el botón **Buscar** abajo, centrado. Si te
equivocaste de forma, un enlace dentro de la misma ventana te lleva a la otra sin cerrarla.

**1 · Buscar una en concreto.** Un desplegable elige cómo:

| Por | Qué hace |
|---|---|
| **Título** | Busca por nombre y muestra su ficha con todos los países donde está. |
| **Actor / actriz** | Muestra su filmografía; el botón *¿Dónde puedo ver sus…?* consulta la disponibilidad de los 24 títulos más populares. |
| **Trama / tema** | Busca por concepto ("viajes en el tiempo", "atraco") con las palabras clave de TMDB. |

**2 · Descubrir por género.** No buscas un título: eliges **género**, y si quieres un
**intervalo de años** (de 2015 a 2025, por ejemplo) y una **nota mínima**. Ejemplo: *series
de drama de 2020 con nota 6 o más*.

Y decides **cómo ordenarlo**, con tres interruptores: **más recientes**, **más antiguas** y
**mayor puntuación**. Los dos primeros se excluyen —una lista no puede ir en los dos sentidos
a la vez—, pero el de puntuación **se combina** con cualquiera de ellos. Al encender *más
recientes* **y** *mayor puntuación* a la vez, la lista va año por año, del más nuevo al más
viejo, y **dentro de cada año salen primero las mejor puntuadas**. En ese caso el paginador
te dice en qué año estás («2026 · página 2 de 5») y al terminar un año salta al siguiente.

Sin encender ninguno, salen las más populares, como siempre. El texto bajo el título del
resultado te recuerda siempre cómo está ordenada la lista.

**El orden también se cambia sobre los resultados**, sin volver al formulario: junto a la
flecha ←, el botón **Ordenar** despliega esos mismos tres interruptores.

El interruptor peli/serie afecta a las dos formas y a las tres búsquedas: puedes buscar una
serie por su nombre, ver la filmografía en TV de un actor o descubrir series por género. Vive
en la barra de arriba, así que para cambiarlo con el formulario abierto hay que cerrarlo; para
que no te pierdas, **el título de la ventana te dice siempre qué estás buscando** («Buscar una
serie en concreto»).

Los filtros de **idioma**, **plataforma** y **país** se eligen **antes de buscar**, dentro de
esa misma ventana; el resultado ya llega filtrado. Cuando aparecen resultados, el formulario se
oculta para que veas las carátulas sin estorbos, y una flecha **←** te devuelve a la búsqueda.
La calificación con la que se filtra en Descubrir es la de **TMDB** (de 0 a 10), no un promedio
de otras webs.

---

## Mis listas

Dos listas independientes, guardadas en el navegador:

- ♥ **Favoritas** — las que te encantan.
- 🔖 **Pendientes de ver** — las que tienes en cola.

Una película puede estar en las dos. Desde la vista de listas, el botón
**¿Dónde puedo verlas ahora?** recorre tus pendientes y te dice cuáles están disponibles
hoy con tus filtros de idioma y plataforma.

Como viven solo en este navegador, en ⚙ tienes **Exportar** e **Importar** para hacer copia.

### Llevarlas a otro dispositivo (opcional)

Junto al ⚙, un botón de **cuenta** te deja crear una cuenta con correo y contraseña (o entrar si
ya la tienes, o recuperarla si la olvidaste). Es **totalmente opcional**: sin iniciar sesión la
app funciona exactamente igual que siempre. Lo único que cambia al iniciar sesión es que tus
listas dejan de ser solo de este navegador: se guardan también en la nube y, si entras con la
misma cuenta en el móvil, aparecen las mismas favoritas y pendientes — sin borrar lo que ya
tuviera cada dispositivo, se juntan las dos.

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
| 5b · Acceso a OMDb | `js/omdb.js` | Notas de IMDb/RT/Metacritic (opcional) |
| 6 · Lógica de idioma | `js/idioma.js` | Filtrado y frase resumen |
| 7 · Mis listas | `js/listas.js` | Favoritas y pendientes |
| 7b · Mi biblioteca | `js/biblioteca.js` | Enlace a tu copia por título |
| 7c · Google Drive | `js/drive.js` | Buscar y reproducir tu copia (Nivel 2) |
| 7d · Cuenta | `js/cuenta.js` | Login, registro, recuperar contraseña y sincronizar listas |
| 8 · Interfaz | `js/ui.js` | Pintado de componentes |
| 9 · Aplicación | `js/app.js` | Vistas, eventos y arranque |
| 10 · PWA | `js/pwa.js` | Service worker y botón de instalar |

Para separarlos: corta cada bloque a su archivo y enlázalos en este orden con etiquetas
`<script src="...">` normales. Cada bloque cuelga de un objeto global (`GMM.tmdb`,
`GMM.ui`…), así que **no hay que tocar ni una línea de código** para que siga funcionando.

---

## Límites conocidos

- **Precios de alquiler y compra**: TMDB no los publica. Haría falta la API de pago de JustWatch.
- **Búsqueda por trama**: TMDB no busca dentro del texto de la sinopsis. Se usa su sistema
  de palabras clave, que funciona bien con conceptos pero no con frases largas.
- **Puntuaciones de IMDb, Rotten Tomatoes y Metacritic**: **ya están** (V GMM 0016), pero
  requieren la clave opcional de OMDb (arriba). La nota con la que se **filtra** en Descubrir
  sigue siendo la de TMDB.
- **Filmografías largas**: se consultan los 24 títulos más populares, para no disparar
  cientos de peticiones.
- **Cuenta y sincronizar listas**: necesita internet para cargar el sistema de cuentas al abrir
  la página. Sin conexión, el botón de cuenta simplemente no hace nada y el resto de la app
  sigue funcionando igual.

---

## Ideas para más adelante

1. **Enlace compartible** — codificar la búsqueda en la URL.
2. **Avísame cuando llegue** — vigilar un título hasta que aparezca en tu país (necesita servidor).
3. **Tráiler incrustado** — un clic sin salir de la app.
4. **Comparador de países** — útil para quien usa VPN.
5. **Sorpréndeme** — película o serie al azar que cumpla tus filtros.

*Ya hechas: cinco carruseles de sugerencias en el inicio, de 20 títulos, ordenados por la nota de
TMDB y con ella a la vista, infinitos y con «Ver más» (V GMM 0017–0019, 0023);
puntuaciones de IMDb / Rotten Tomatoes / Metacritic vía OMDb (V GMM 0016);
PWA instalable (V GMM 0003); descubrir por género, año y nota, y las series
(V GMM 0005); interruptor Película/Serie con series en todas las búsquedas (V GMM 0006);
orden e intervalo de años en Descubrir (V GMM 0015).*

---

Datos de películas y disponibilidad: [TMDB](https://www.themoviedb.org) / JustWatch.
Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
