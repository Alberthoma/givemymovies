# Empezar desde cero con GMM Server

Guía para un usuario que nunca ha instalado nada de esto: qué instalar, en qué orden, y cómo
terminar viendo tus películas desde el móvil fuera de casa. Sigue los pasos en orden — cada uno
depende del anterior.

De todos los archivos de esta carpeta, solo hay **dos en los que harás doble clic**:
`GMM-Server.vbs` (enciende el servidor) y `GMM-Instalar.vbs` (instala lo que le falte al PC). El
resto —los `.js`, el `.json`, los `.ps1`— son piezas internas que esos dos usan por dentro; nunca
hace falta abrirlas a mano.

> **¿Vas a instalarlo en otro PC, no en este?** No copies esta carpeta entera. Usa en su lugar
> `GMM-Server.exe` y `GMM-Instalar.exe` (ver "Compilar los `.exe`" en `README.md`) — son esos
> mismos dos programas, pero en un solo archivo cada uno, sin nada más alrededor. Todo lo que
> viene abajo vale igual, solo que en vez de `GMM-Server.vbs` es `GMM-Server.exe` y así.

## Qué necesita el PC (antes de tocar GMM Server)

- **Windows de 64 bits.**
- **Node.js 22 o posterior.** Es el único programa obligatorio aparte de GMM Server. GMM Server
  está escrito en JavaScript y Node.js es lo que lo ejecuta — sin él, nada de esto arranca.
  - **Más fácil: doble clic en `GMM-Instalar.vbs`** (el mismo asistente del paso 3) y pulsa
    "Instalar Node.js" — lo instala solo, sin abrir el navegador ni escribir nada.
  - A mano: descárgalo de <https://nodejs.org> (botón grande, versión LTS) e instálalo con las
    opciones por defecto.
  - Para comprobar que quedó instalado, abre PowerShell y escribe `node --version`: debe
    responder `v22` o más.
- **FFmpeg y Tailscale son opcionales** y se instalan más adelante (paso 3). No hacen falta para
  tener GMM Server funcionando en el propio PC.

No hace falta instalar nada más: GMM Server no usa npm ni librerías externas.

## 1. Indicar dónde están tus películas y encender el servidor

Ve a la carpeta `gmm-server` y haz **doble clic en `GMM-Server.vbs`**.

La primera vez, prepara solo la configuración privada (`PRIVADO/configuracion.json`, con una
clave de acceso generada al azar) — no hace falta que hagas nada en ese momento. Se abre una
ventana con:

- El botón **"Añadir carpeta..."**: pulsa aquí y elige, con el selector nativo de Windows, la
  carpeta donde tienes tus películas. Puedes añadir varias carpetas o discos distintos.
- El botón **"Iniciar servidor"**: arranca el servidor y hace su primer escaneo de las carpetas
  que hayas añadido — lo verás en la lista de "Actividad", abajo.
- La **clave de administración**, con un botón "Copiar" — la necesitas en el paso siguiente.
- Si cierras esta ventana con el servidor encendido, se oculta en la bandeja del sistema (junto
  al reloj) y sigue funcionando ahí. No hace falta dejarla siempre visible, pero no la cierres
  del todo mientras quieras usar "Te la tengo".

## 2. Conectar la app GiveMyMovies (en el mismo PC)

1. Abre GiveMyMovies en el navegador.
2. Ve a **⚙ Ajustes → GMM Server** y escribe:
   - Dirección: `http://127.0.0.1:7399`
   - Clave: la que copiaste en el paso 1.
3. Pulsa **Probar conexión** y guarda.
4. Abre **▶ Te la tengo**: deberías ver tu catálogo de películas con carátulas.

Si llegas hasta aquí y ves tus películas, el servidor funciona. Todo lo de abajo es para verlo
**también desde el móvil**, dentro y fuera de casa — y, si hace falta, para ver vídeos que hoy
solo se pueden descargar.

## 3. Instalar FFmpeg y Tailscale (opcional, con el asistente)

En la carpeta `gmm-server`, haz doble clic en **`GMM-Instalar.vbs`**. Se abre una ventana con
botones para:

- **Instalar FFmpeg**: arregla que algunos vídeos (normalmente `.mkv`) no se reproduzcan en el
  navegador y solo se puedan descargar. Lo instala solo. Después de instalarlo, el siguiente
  escaneo de GMM Server (basta con volver a pulsar "Iniciar servidor" en el panel del paso 1, o
  reiniciarlo si ya estaba encendido) detecta qué vídeos necesitan conversión, y la hace la
  primera vez que los reproduces.
- **Instalar Tailscale en este PC**: lo instala solo.
- **Iniciar sesión en Tailscale**: abre la app para que entres con tu cuenta (Google, Microsoft
  o email) — esta parte no se puede automatizar, tienes que hacerla tú.
- **Abrir página de Tailscale para el móvil**: te lleva a la página desde la que instalas la app
  en el teléfono.

## 4. Instalar Tailscale también en el móvil

1. En el móvil, instala la app **Tailscale** desde Google Play o App Store (el botón del paso 3
   te lleva ahí).
2. Inicia sesión con la **misma cuenta** que usaste en el PC en el paso 3. Esto es lo que pone
   a los dos dispositivos en la misma red privada.

## 5. Activar el acceso remoto en GMM Server

**Importante:** el móvil necesita una dirección `https://`, no `http://`. GiveMyMovies se sirve
por HTTPS (`https://alberthoma.github.io`), y todos los navegadores modernos bloquean que una
página seguro hable con una dirección insegura — así que aunque la IP y el puerto estén bien,
con `http://` a secas el móvil se queda sin conectar y no avisa por qué. `GMM-Server.vbs` resuelve
esto solo, con Tailscale de por medio, sin que tengas que escribir nada en una consola:

1. En la ventana de `GMM-Server.vbs` (paso 1), busca la sección **"Acceso remoto seguro"** y
   pulsa **"Activar HTTPS con Tailscale"**.
2. La primera vez puede pedirte un paso que solo tú puedes hacer (inicia sesión en tu cuenta):
   - Ve a <https://login.tailscale.com/admin/dns>
   - Busca **"HTTPS Certificates"** y actívalo
   - Vuelve a la ventana de GMM Server y pulsa el botón otra vez
3. Cuando funcione, aparece una dirección tipo `https://tu-pc.tailXXXXX.ts.net` en el campo de
   al lado, con un botón **"Copiar"**.

## 6. Conectar el móvil de verdad

1. En el móvil, con Tailscale ya conectado (paso 4), abre GiveMyMovies.
2. Ve a **⚙ Ajustes → GMM Server** y pega la dirección que copiaste en el paso 5 —
   **sin ningún número de puerto al final**, empieza por `https://`.
3. La clave es la misma de siempre (paso 1).
4. Pulsa **Probar conexión** y abre **▶ Te la tengo**.

## 7. Probarlo de verdad fuera de casa

Sal de tu wifi (usa los datos móviles, por ejemplo) y repite el paso 6. Si ves tu catálogo y
puedes reproducir una película, todo el circuito funciona: Tailscale te conecta con tu PC de
casa, y GMM Server (encendido con `GMM-Server.vbs`) te sirve las películas.

**Si tienes otra VPN instalada** (NordVPN, ExpressVPN y similares), desconéctala mientras uses
"Te la tengo" fuera de casa. Dos VPN a la vez en el mismo dispositivo es un conflicto conocido:
Tailscale puede seguir mostrando "Connected" con todo en verde, pero el tráfico real entre tus
dispositivos deja de pasar.

## Resumen de qué debe estar encendido para que funcione desde fuera

| Componente | Qué hace | ¿Hace falta encenderlo cada vez? |
|---|---|---|
| El PC de casa | Tiene tus películas | Tiene que estar encendido |
| `GMM-Server.vbs` | El programa que sirve el catálogo y los vídeos | Sí — si lo cierras del todo (no solo minimizarlo a la bandeja), no hay nada escuchando |
| Tailscale (PC) | Abre el camino privado hacia el PC | Se queda encendido solo, arranca con Windows |
| Tailscale (móvil) | Igual, en el teléfono | Se queda encendido solo, no hay que abrir la app cada vez |
| "Activar HTTPS con Tailscale" | Pone el candado seguro delante de GMM Server | Solo hace falta pulsarlo una vez; Tailscale lo recuerda aunque reinicies el PC |
| FFmpeg | Convierte los vídeos que el navegador no soporta | No se "enciende": GMM Server lo usa solo cuando hace falta |
| Otra VPN (NordVPN, etc.) | — | **Apagarla** mientras uses "Te la tengo" fuera de casa: puede bloquear el tráfico de Tailscale sin avisar |
