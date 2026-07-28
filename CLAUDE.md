# CLAUDE.md — givemymovies

> Contexto del proyecto para cualquier sesión futura. Léelo entero antes de tocar código.

**Versión activa:** `V GMM 0002`
**Próxima versión:** `V GMM 0003`
**Última actualización:** 2026-07-27

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

Tres formas de entrar a la búsqueda:

| Modo | Entrada | Salida |
|---|---|---|
| **Película** | Título | Ficha + todos los países donde está |
| **Actor / Actriz** | Nombre | Filmografía + dónde ver cada título |
| **Trama / Tema** | Concepto | Cuadrícula de películas que encajan |

Plataforma y país son **opcionales**; el idioma es el filtro que da sentido a todo.

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
| **Un único `index.html`** | Todo dentro: HTML, CSS y JS. Se abre con doble clic, sin servidor. |
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
| 6 | `js/idioma.js` | `GMM.idioma` — **el núcleo**: evaluar, filtrar, frase |
| 7 | `js/listas.js` | `GMM.listas` — favoritas y pendientes |
| 8 | `js/ui.js` | `GMM.ui` — pintado de componentes, avisos |
| 9 | `js/app.js` | `GMM.app` — estado, vistas, eventos, arranque |

### Estado

`GMM.app` guarda un único objeto `estado` con `modo`, `plataforma`, `pais`, `idioma`,
`mostrarTodos`, `vista`, `pelicula`, `proveedores`, `persona`, `filmografia`, `disponibilidad`.

**Cambiar un filtro no vuelve a llamar a la API**: `repintarVista()` recalcula sobre los
datos ya en memoria. Mantén esa propiedad, es lo que hace la app ágil.

### Persistencia (`localStorage`)

| Clave | Contenido |
|---|---|
| `gmm_tmdb_key` | Clave de la API de TMDB |
| `gmm_prefs` | Modo, plataforma, país e idioma |
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
| Buscar película | `/search/movie` |
| Buscar persona | `/search/person` |
| Filmografía | `/person/{id}/movie_credits` |
| Ficha | `/movie/{id}` |
| **Dónde verla** | `/movie/{id}/watch/providers` ← el dato central |
| Trama | `/search/keyword` → `/discover/movie?with_keywords=` |
| Catálogo de plataformas | `/watch/providers/movie` |

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
node pruebas/logica.js      # 64 comprobaciones · sin dependencias · instantáneo
node pruebas/imagenes.js    # 12 comprobaciones · necesita internet · ~30 s
node pruebas/interfaz.js    # 49 comprobaciones · playwright-core · ~40 s
```

Última ejecución: **125 comprobaciones, todas correctas**, sin errores de JavaScript
en consola. Detalle en `pruebas/LEEME.md`.

Verificado además **con datos reales** (17 comprobaciones aparte, no versionadas): 130 países
y 799 plataformas para *Interstellar*, 19 tras filtrar por español; filmografía de Penélope
Cruz con 98 títulos. La app aguanta el volumen real sin degradarse.

- **Toca `GMM.demo`** → obligatorio `pruebas/imagenes.js` (ver §6).
- **Toca CSS o el DOM** → obligatorio `pruebas/interfaz.js` y mirar `pruebas/capturas/`.
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
- **Solo películas**: sin series todavía. Es la mejora nº 1 recomendada.
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

## 11. Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| V GMM 0001 | 2026-07-27 | Versión inicial. Buscador en tres modos (película, actor, trama), filtros de plataforma/país/idioma, deducción de idioma por mercado con insignias de confianza, fichas con carátula, filmografía con consulta en lote, listas de favoritas y pendientes con exportar/importar, modo demo de 8 películas. Añadidos `CLAUDE.md`, `PROMPT-MAESTRO.md`, carpeta `pruebas/` y el skill `givemymovies-commit`. |
| V GMM 0002 | 2026-07-27 | Distinguir «no está en ninguna parte» de «está, pero no en la plataforma que filtraste». Antes ambos casos daban el mismo mensaje genérico. Ahora la frase nombra la plataforma que falla y un botón quita el filtro de un clic. Lo destapó una búsqueda real: *Siempre el mismo día* + Netflix, que no existe en Netflix en ningún país aunque sí en 14 mercados hispanohablantes. |
