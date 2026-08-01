# PENDIENTES.md — givemymovies

> Temas abiertos, ninguno urgente. **No los abordes por iniciativa propia**: están aquí para
> que la decisión esté preparada cuando el usuario los retome.
>
> **Separado de `CLAUDE.md` el 2026-08-01 por coste de contexto.** `CLAUDE.md` se carga entero
> en cada sesión y estos son ensayos de decisión que solo hacen falta el día que se retoma cada
> tema. `CLAUDE.md` §11 conserva una línea por tema con el puntero aquí.

---

## 1 — La clave de TMDB en el móvil

**Planteado el 28-07-2026. Resuelto en la práctica por la vía A desde la V GMM 0004.**

El usuario quería abrir la app desde su móvil, y preguntó: si la clave no se sube al
repositorio, ¿cómo funciona allí?

### La aclaración que disolvió el problema

**La clave no necesita viajar en el repositorio.** La app la lee del `localStorage` del
navegador donde se abre, no del código. Publicar el código y pegar la clave una vez en el ⚙ del
móvil basta: ese dispositivo la recuerda indefinidamente.

`PRIVADO/clave-local.js` es solo un atajo para el PC del usuario; no es el mecanismo.

**Esto es lo que se hizo:** la app está publicada en
<https://alberthoma.github.io/givemymovies/> y cada dispositivo guarda su propia clave.

### Lo que queda abierto

Solo si algún día la usa **alguien más que él**. Con la vía A, cada visitante necesita su
propia clave de TMDB, lo que es una barrera de entrada real.

| Opción | Cómo funciona | Coste | Riesgo de la clave |
|---|---|---|---|
| **A · Pegarla en el móvil** *(la vigente)* | Publicar solo el código. Una vez en el ⚙ y listo | Cero. Ya está implementado | Ninguno |
| **B · Clave en el código + Pages** | Hardcodear la clave y publicar | Cero | **Expuesta a todo internet**, y en el historial de git para siempre |
| **C · Proxy propio** | Función serverless (Cloudflare Workers, Vercel, Netlify) que guarda la clave y reenvía a TMDB. La app llama al proxy | Un servicio más que mantener; hay planes gratuitos | Ninguno: la clave nunca llega al navegador |
| **D · Publicar fuera de git** | Netlify Drop o variable de entorno inyectada al desplegar | Bajo | Bajo, según el proveedor |

**C es la respuesta correcta** el día que la use alguien más.

**No implementar B.** Si el usuario insiste, avisar de que la clave queda pública y de que
habría que regenerarla al retirarla.

### Dato que hay que tener presente

**Un repositorio privado NO da una web privada.** GitHub Pages publica el sitio de forma abierta
aunque el repositorio sea privado; el control de acceso solo existe en Enterprise. Y publicar
Pages desde un repositorio privado exige plan de pago. Conviene confirmar las condiciones
vigentes antes de apostar por esa vía.

---

## 2 — Login y sincronización de las listas entre dispositivos

**Planteado el 28-07-2026. Sin resolver.** El usuario apunta a Firebase.

**El problema real.** `gmm_listas` vive en `localStorage`, que es **por navegador y por
dispositivo**. Lo que guarde en el móvil no aparece en el PC ni al revés: son dos listas
distintas con el mismo nombre. Además, borrar los datos del sitio se las lleva. Hoy el único
puente es exportar e importar el JSON a mano desde ⚙.

**Lo que haría falta**, en orden:

1. **Login.** El propio usuario lo dedujo, y es correcto: sin saber quién es, no hay «mis
   listas» — el servidor no sabría de quién son. Es el primer paso, no un extra.
   - **Recomendado: acceso con Google.** En un móvil es un toque, sin contraseña que recordar
     ni que custodiar. Firebase Auth lo da hecho.
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
proyecto prohíbe las librerías (`CLAUDE.md` §3, R3). Hay salida: Firestore tiene **API REST**,
así que se puede hablar con él usando `fetch` a pelo y mantener la regla intacta. Es algo más de
código, pero conserva lo que define al proyecto. **Plantéaselo al usuario antes de meter un SDK.**

**Dato que le tranquilizará:** la configuración web de Firebase (`apiKey`, `projectId`…) **está
pensada para ser pública** — no es un secreto como la clave de TMDB. La seguridad no viene de
esconderla, sino de las reglas de Firestore y de la autenticación. O sea: eso sí puede ir dentro
de `index.html` sin problema.

---

## 3 — Premios (Oscar, Emmy)

**Planteado en la V GMM 0024. Descartado, con el usuario.**

La nota de la 0024 pedía una colección de «premiados/nominados» en Descubrir, pero **TMDB no
publica datos de premios**: no hay endpoint ni campo, así que aproximarlo sería inventar.

Si algún día se retoma, haría falta **una fuente aparte** (una lista curada, o una API de
premios) o aceptar una aproximación honesta por nota + votos, dicha como tal en la interfaz.
