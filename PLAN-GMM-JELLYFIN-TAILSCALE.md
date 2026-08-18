# Plan: GiveMyMovies + Jellyfin + Tailscale

## El problema, desde el principio

Tú tienes una app propia, GiveMyMovies. Su valor no es solo reproducir películas: tiene tu
diseño, carátulas, información de TMDB, listas, cuentas y la sección **"Te la tengo"**.

Además tienes una biblioteca personal grande, actualmente en un disco externo, y quieres que unas
30 personas —familiares y amigos— puedan verla desde fuera de tu casa.

El problema es que GiveMyMovies, por sí sola, es una PWA publicada en Internet: no guarda ni
transmite los vídeos. Para entregar las películas necesita un servidor que haga cuatro trabajos
difíciles:

- Leer tu disco externo.
- Saber qué dispositivo puede reproducir cada formato.
- Convertir vídeos incompatibles cuando sea necesario.
- Manejar varias personas viendo al mismo tiempo de forma segura.

Creamos GMM Server propio para empezar ese camino. Funciona para tu biblioteca personal, pero para
30 personas habría que seguir desarrollando desde cero cuentas individuales, permisos, conversión
robusta, calidad adaptativa y control de sesiones.

Jellyfin ya resuelve esa parte. Por eso ahora la propuesta no es abandonar GMM: es mantener
GiveMyMovies como tu app y usar Jellyfin solo como motor interno de vídeo.

Hay otras dos limitaciones reales:

- Aún no tienes NAS; tienes un PC y disco externo.
- Tu internet solo tiene 40 Mbps de subida. Eso permite 30 personas con acceso, pero no 30
  reproducciones simultáneas en buena calidad.

## La solución que vamos a construir

GiveMyMovies seguirá siendo la aplicación que ven todos.

Jellyfin vivirá en tu PC primero y en el NAS después. Será quien lea las películas, convierta
formatos y entregue el vídeo.

Tailscale hará que el servidor sea privado: no abriremos puertos del router ni mostraremos tu IP
de casa.

Tus familiares no tendrán que usar la interfaz de Jellyfin. Entrarán a GiveMyMovies, verán
"Te la tengo" y reproducirán desde ahí.

## Qué haré primero con tu PC y disco externo

Prepararé tu PC como servidor provisional, sin tocar las películas.

- Jellyfin leerá la carpeta existente del disco externo.
- No moveré, borraré, renombraré ni formatearé nada.
- Configuraré el PC para que no se duerma mientras está compartiendo películas.
- Revisaré el procesador y gráfica para saber si puede convertir vídeos con aceleración.
- Comprobaré películas MP4, MKV y otros formatos reales de tu biblioteca.

El disco externo seguirá siendo tu biblioteca principal. Como no hay una segunda copia, todavía no
lo consideraremos un sistema seguro ante fallos; el NAS resolverá eso más adelante.

## Cómo protegeremos el acceso

Instalaré Tailscale en el PC que tiene el disco.

- Jellyfin quedará accesible mediante HTTPS privado.
- No se abrirá ningún puerto del router.
- Cada familiar tendrá su propia cuenta de Tailscale; no se compartirán cuentas.
- Solo podrán llegar al servidor de películas, no a tu PC completo ni a tu red doméstica.
- Podrás revocar a cualquier persona en cualquier momento.

Después crearé una cuenta Jellyfin individual para cada invitado. Tú conservarás el único usuario
administrador.

## Cómo entra GiveMyMovies

Modificaré "Te la tengo" para que, en lugar de pedir los vídeos al GMM Server actual, los pida a
Jellyfin.

La app hará esto:

- Mostrar la biblioteca de Jellyfin con el diseño de GiveMyMovies.
- Mantener carátulas, fichas, listas y búsqueda de GMM.
- Pedir a cada invitado que vincule una sola vez su cuenta Jellyfin.
- Reproducir el vídeo dentro del visor de GiveMyMovies.
- Mostrar si se está reproduciendo directamente, si Jellyfin está preparando una versión
  compatible o si el servidor está ocupado.

No compartiré tu clave de administrador. Cada persona tendrá su propio acceso y se podrá retirar
sin afectar a las demás.

El GMM Server actual no se borrará: quedará como respaldo mientras validamos Jellyfin integrado.

## Cómo manejaremos tus 40 Mbps

No prometemos lo imposible: con 40 Mbps de subida no habrá 30 películas en 1080p simultáneas.

La configuración inicial será prudente:

- Calidad remota máxima de 4 Mbps.
- Pruebas con 1, luego 3 y después 5 reproducciones simultáneas.
- Límite inicial de 3 reproducciones desde GiveMyMovies.
- Si las pruebas salen bien, subir el límite a 5.
- Si ya hay demasiadas personas viendo, GMM mostrará un aviso claro en lugar de dejar que todos
  tengan cortes.

Así las 30 personas pueden tener cuenta y acceso, pero la experiencia se mantiene estable.

## Cómo haremos las pruebas

No invitaremos a todos de golpe.

Primero probaré contigo dentro y fuera de casa. Después invitaremos a tres familiares con
dispositivos distintos: móvil, PC y TV. Luego probaremos varias reproducciones a la vez.

Mediremos uso del PC, temperatura, velocidad de subida, conversiones y cortes. Solo cuando sea
estable se abre el acceso al resto.

## Qué ocurrirá cuando compres el NAS

Cuando tengas el NAS, trasladaremos Jellyfin y la biblioteca al nuevo equipo.

- Copiaremos primero las películas; no se borra el disco externo hasta verificar todo.
- El NAS se convertirá en el servidor permanente.
- El disco externo pasará a ser respaldo.
- Las cuentas, Tailscale y GiveMyMovies seguirán igual.
- Tus invitados no tendrán que aprender nada nuevo ni cambiar de app.

Este es el plan completo: tu PC y disco externo permiten empezar ahora; Jellyfin aporta el motor
profesional; Tailscale protege la conexión; GiveMyMovies continúa siendo el rostro y la
experiencia de todo el proyecto.
