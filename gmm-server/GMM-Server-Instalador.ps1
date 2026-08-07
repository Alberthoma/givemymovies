<#
    GMM-Server-Instalador.ps1

    Asistente de instalacion para lo que le falta a GMM Server: Node.js (sin
    el que nada de esto arranca), FFmpeg (para reproducir videos que el
    navegador no soporta tal cual) y Tailscale (para conectarte desde fuera
    de casa). Comprueba que hace falta, instala lo que puede instalar solo
    (via winget), y para lo que no se puede automatizar (iniciar sesion en
    Tailscale, instalar la app en el movil) abre la pagina correcta y
    explica el paso siguiente.

    Este script es PowerShell puro: no necesita Node.js para funcionar el,
    asi que puede instalarlo sin problema de huevo y gallina.

    No se abre a mano: hazlo con doble clic en GMM-Instalar.vbs, en esta
    misma carpeta, que lo lanza sin ventanas negras de por medio.
#>

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Mismo truco que GMM-Server-Panel.ps1: el lanzador abre PowerShell normal y
# es el propio script el que oculta su consola ya en marcha, para que el
# formulario nazca visible (ver el comentario equivalente alli).
Add-Type -Name Consola -Namespace GmmInstalador -MemberDefinition '
    [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
'
$ventanaConsola = [GmmInstalador.Consola]::GetConsoleWindow()
if ($ventanaConsola -ne [IntPtr]::Zero) { [GmmInstalador.Consola]::ShowWindow($ventanaConsola, 0) | Out-Null }

$script:procesoNode = $null
$script:procesoFFmpeg = $null
$script:procesoTailscale = $null

# ------------------------------------------------------------------
# Deteccion de lo que ya esta instalado
# ------------------------------------------------------------------

function Hay-Winget {
    return $null -ne (Get-Command winget -ErrorAction SilentlyContinue)
}

function Hay-Node {
    return $null -ne (Get-Command node -ErrorAction SilentlyContinue)
}

function Hay-FFmpeg {
    return $null -ne (Get-Command ffmpeg -ErrorAction SilentlyContinue)
}

function Hay-Tailscale {
    if (Get-Command tailscale -ErrorAction SilentlyContinue) { return $true }
    return Test-Path (Join-Path $env:ProgramFiles "Tailscale\tailscale.exe")
}

# Un programa recien instalado con winget no se ve en este proceso hasta
# refrescar el PATH: Windows lo actualiza en el registro y avisa a las
# ventanas abiertas, pero PowerShell no vuelve a leerlo solo. Sin esto,
# "Refrescar-Estado" seguiria diciendo "no instalado" aunque ya lo este,
# hasta cerrar y volver a abrir este asistente.
function Actualizar-RutaEntorno {
    $rutaMaquina = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $rutaUsuario = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = @($rutaMaquina, $rutaUsuario) -join ";"
}

# ------------------------------------------------------------------
# Formulario principal
# ------------------------------------------------------------------

$forma = New-Object System.Windows.Forms.Form
$forma.Text = "GMM Server - Instalar Node.js, FFmpeg y Tailscale"
$forma.Size = New-Object System.Drawing.Size(560, 700)
$forma.StartPosition = "CenterScreen"
$forma.FormBorderStyle = "FixedDialog"
$forma.MaximizeBox = $false

$etiquetaIntro = New-Object System.Windows.Forms.Label
$etiquetaIntro.Text = "Esto prepara tu PC para GMM Server: Node.js hace falta siempre; FFmpeg (ver" + `
    " cualquier video) y Tailscale (conectarte desde fuera de casa) son opcionales."
$etiquetaIntro.Location = New-Object System.Drawing.Point(20, 15)
$etiquetaIntro.Size = New-Object System.Drawing.Size(510, 40)
$forma.Controls.Add($etiquetaIntro)

# ---- Grupo Node.js ----
$grupoNode = New-Object System.Windows.Forms.GroupBox
$grupoNode.Text = "Node.js (obligatorio: sin esto nada de GMM Server arranca)"
$grupoNode.Location = New-Object System.Drawing.Point(20, 60)
$grupoNode.Size = New-Object System.Drawing.Size(510, 110)
$forma.Controls.Add($grupoNode)

$etiquetaNode = New-Object System.Windows.Forms.Label
$etiquetaNode.Location = New-Object System.Drawing.Point(15, 25)
$etiquetaNode.Size = New-Object System.Drawing.Size(480, 20)
$grupoNode.Controls.Add($etiquetaNode)

$botonNode = New-Object System.Windows.Forms.Button
$botonNode.Text = "Instalar Node.js"
$botonNode.Location = New-Object System.Drawing.Point(15, 50)
$botonNode.Size = New-Object System.Drawing.Size(180, 32)
$grupoNode.Controls.Add($botonNode)

$botonNodePagina = New-Object System.Windows.Forms.Button
$botonNodePagina.Text = "Plan B: pagina manual"
$botonNodePagina.Location = New-Object System.Drawing.Point(205, 50)
$botonNodePagina.Size = New-Object System.Drawing.Size(180, 32)
$grupoNode.Controls.Add($botonNodePagina)

$etiquetaNodePagina = New-Object System.Windows.Forms.Label
$etiquetaNodePagina.Text = "Si 'Instalar Node.js' ya dijo 'instalado correctamente', NO hace falta tocar el Plan B."
$etiquetaNodePagina.Location = New-Object System.Drawing.Point(15, 85)
$etiquetaNodePagina.Size = New-Object System.Drawing.Size(480, 18)
$etiquetaNodePagina.ForeColor = [System.Drawing.Color]::DimGray
$etiquetaNodePagina.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$grupoNode.Controls.Add($etiquetaNodePagina)

# ---- Grupo FFmpeg ----
$grupoFFmpeg = New-Object System.Windows.Forms.GroupBox
$grupoFFmpeg.Text = "FFmpeg (conversion de video)"
$grupoFFmpeg.Location = New-Object System.Drawing.Point(20, 182)
$grupoFFmpeg.Size = New-Object System.Drawing.Size(510, 110)
$forma.Controls.Add($grupoFFmpeg)

$etiquetaFFmpeg = New-Object System.Windows.Forms.Label
$etiquetaFFmpeg.Location = New-Object System.Drawing.Point(15, 25)
$etiquetaFFmpeg.Size = New-Object System.Drawing.Size(480, 20)
$grupoFFmpeg.Controls.Add($etiquetaFFmpeg)

$botonFFmpeg = New-Object System.Windows.Forms.Button
$botonFFmpeg.Text = "Instalar FFmpeg"
$botonFFmpeg.Location = New-Object System.Drawing.Point(15, 50)
$botonFFmpeg.Size = New-Object System.Drawing.Size(180, 32)
$grupoFFmpeg.Controls.Add($botonFFmpeg)

$botonFFmpegPagina = New-Object System.Windows.Forms.Button
$botonFFmpegPagina.Text = "Plan B: pagina manual"
$botonFFmpegPagina.Location = New-Object System.Drawing.Point(205, 50)
$botonFFmpegPagina.Size = New-Object System.Drawing.Size(180, 32)
$grupoFFmpeg.Controls.Add($botonFFmpegPagina)

$etiquetaFFmpegPagina = New-Object System.Windows.Forms.Label
$etiquetaFFmpegPagina.Text = "Si 'Instalar FFmpeg' ya dijo 'instalado correctamente', NO hace falta tocar el Plan B."
$etiquetaFFmpegPagina.Location = New-Object System.Drawing.Point(15, 85)
$etiquetaFFmpegPagina.Size = New-Object System.Drawing.Size(480, 18)
$etiquetaFFmpegPagina.ForeColor = [System.Drawing.Color]::DimGray
$etiquetaFFmpegPagina.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$grupoFFmpeg.Controls.Add($etiquetaFFmpegPagina)

# ---- Grupo Tailscale ----
$grupoTailscale = New-Object System.Windows.Forms.GroupBox
$grupoTailscale.Text = "Tailscale (conectarte desde fuera de casa)"
$grupoTailscale.Location = New-Object System.Drawing.Point(20, 302)
$grupoTailscale.Size = New-Object System.Drawing.Size(510, 175)
$forma.Controls.Add($grupoTailscale)

$etiquetaTailscale = New-Object System.Windows.Forms.Label
$etiquetaTailscale.Location = New-Object System.Drawing.Point(15, 25)
$etiquetaTailscale.Size = New-Object System.Drawing.Size(480, 20)
$grupoTailscale.Controls.Add($etiquetaTailscale)

$botonTailscale = New-Object System.Windows.Forms.Button
$botonTailscale.Text = "Instalar Tailscale en este PC"
$botonTailscale.Location = New-Object System.Drawing.Point(15, 50)
$botonTailscale.Size = New-Object System.Drawing.Size(230, 32)
$grupoTailscale.Controls.Add($botonTailscale)

$botonTailscaleAbrir = New-Object System.Windows.Forms.Button
$botonTailscaleAbrir.Text = "Iniciar sesion en Tailscale"
$botonTailscaleAbrir.Location = New-Object System.Drawing.Point(255, 50)
$botonTailscaleAbrir.Size = New-Object System.Drawing.Size(230, 32)
$botonTailscaleAbrir.Enabled = $false
$grupoTailscale.Controls.Add($botonTailscaleAbrir)

$etiquetaTailscaleNota = New-Object System.Windows.Forms.Label
$etiquetaTailscaleNota.Text = "Iniciar sesion abre tu navegador: entra con la MISMA cuenta que usaras en el movil."
$etiquetaTailscaleNota.Location = New-Object System.Drawing.Point(15, 88)
$etiquetaTailscaleNota.Size = New-Object System.Drawing.Size(480, 18)
$etiquetaTailscaleNota.ForeColor = [System.Drawing.Color]::DimGray
$etiquetaTailscaleNota.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$grupoTailscale.Controls.Add($etiquetaTailscaleNota)

$botonTailscaleMovil = New-Object System.Windows.Forms.Button
$botonTailscaleMovil.Text = "Solo para tu MOVIL: abrir pagina de Tailscale"
$botonTailscaleMovil.Location = New-Object System.Drawing.Point(15, 112)
$botonTailscaleMovil.Size = New-Object System.Drawing.Size(470, 32)
$grupoTailscale.Controls.Add($botonTailscaleMovil)

$etiquetaTailscaleMovil = New-Object System.Windows.Forms.Label
$etiquetaTailscaleMovil.Text = "Este boton es para el TELEFONO, no para este PC (este PC ya quedo listo con 'Instalar Tailscale en este PC', arriba)."
$etiquetaTailscaleMovil.Location = New-Object System.Drawing.Point(15, 148)
$etiquetaTailscaleMovil.Size = New-Object System.Drawing.Size(480, 18)
$etiquetaTailscaleMovil.ForeColor = [System.Drawing.Color]::DimGray
$etiquetaTailscaleMovil.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$grupoTailscale.Controls.Add($etiquetaTailscaleMovil)

# ---- Registro de actividad ----
$etiquetaRegistro = New-Object System.Windows.Forms.Label
$etiquetaRegistro.Text = "Actividad:"
$etiquetaRegistro.Location = New-Object System.Drawing.Point(20, 485)
$etiquetaRegistro.Size = New-Object System.Drawing.Size(200, 20)
$forma.Controls.Add($etiquetaRegistro)

$cajaRegistro = New-Object System.Windows.Forms.TextBox
$cajaRegistro.Location = New-Object System.Drawing.Point(20, 507)
$cajaRegistro.Size = New-Object System.Drawing.Size(510, 110)
$cajaRegistro.Multiline = $true
$cajaRegistro.ReadOnly = $true
$cajaRegistro.ScrollBars = "Vertical"
$cajaRegistro.Font = New-Object System.Drawing.Font("Consolas", 9)
$forma.Controls.Add($cajaRegistro)

$botonCerrar = New-Object System.Windows.Forms.Button
$botonCerrar.Text = "Cerrar"
$botonCerrar.Location = New-Object System.Drawing.Point(430, 622)
$botonCerrar.Size = New-Object System.Drawing.Size(100, 32)
$forma.Controls.Add($botonCerrar)

function Escribir-Registro([string]$texto) {
    $marca = Get-Date -Format "HH:mm:ss"
    $linea = "[$marca] $texto`r`n"
    if ($cajaRegistro.InvokeRequired) {
        $cajaRegistro.Invoke([Action]{ $cajaRegistro.AppendText($linea) })
    } else {
        $cajaRegistro.AppendText($linea)
    }
}

# ------------------------------------------------------------------
# Refrescar el estado mostrado
# ------------------------------------------------------------------

function Refrescar-Estado {
    Actualizar-RutaEntorno

    if (Hay-Node) {
        $etiquetaNode.Text = "Node.js: instalado."
        $etiquetaNode.ForeColor = [System.Drawing.Color]::SeaGreen
        $botonNode.Text = "Ya esta instalado"
    } else {
        $etiquetaNode.Text = "Node.js: no instalado todavia. Sin esto, GMM Server no arranca."
        $etiquetaNode.ForeColor = [System.Drawing.Color]::Firebrick
        $botonNode.Text = "Instalar Node.js"
    }
    $botonNode.Enabled = -not (Hay-Node) -and ($null -eq $script:procesoNode)

    if (Hay-FFmpeg) {
        $etiquetaFFmpeg.Text = "FFmpeg: instalado."
        $etiquetaFFmpeg.ForeColor = [System.Drawing.Color]::SeaGreen
        $botonFFmpeg.Text = "Ya esta instalado"
    } else {
        $etiquetaFFmpeg.Text = "FFmpeg: no instalado todavia. Hace falta para ver videos MKV en el navegador."
        $etiquetaFFmpeg.ForeColor = [System.Drawing.Color]::Firebrick
        $botonFFmpeg.Text = "Instalar FFmpeg"
    }
    $botonFFmpeg.Enabled = -not (Hay-FFmpeg) -and ($null -eq $script:procesoFFmpeg)

    if (Hay-Tailscale) {
        $etiquetaTailscale.Text = "Tailscale: instalado en este PC."
        $etiquetaTailscale.ForeColor = [System.Drawing.Color]::SeaGreen
        $botonTailscale.Text = "Ya esta instalado"
        $botonTailscaleAbrir.Enabled = $true
    } else {
        $etiquetaTailscale.Text = "Tailscale: no instalado todavia en este PC."
        $etiquetaTailscale.ForeColor = [System.Drawing.Color]::Firebrick
        $botonTailscale.Text = "Instalar Tailscale en este PC"
        $botonTailscaleAbrir.Enabled = $false
    }
    $botonTailscale.Enabled = -not (Hay-Tailscale) -and ($null -eq $script:procesoTailscale)
}

# ------------------------------------------------------------------
# Vigilar una instalacion de winget en segundo plano, sin congelar la
# ventana (mismo patron que el temporizador de arranque de GMM-Server-Panel.ps1)
# ------------------------------------------------------------------

function Vigilar-Instalacion([System.Diagnostics.Process]$proceso, [string]$etiqueta, [ref]$refProceso, [System.Windows.Forms.Button]$boton) {
    $temporizador = New-Object System.Windows.Forms.Timer
    $temporizador.Interval = 800
    $temporizador.Add_Tick({
        if (-not $proceso.HasExited) { return }
        $temporizador.Stop()
        $temporizador.Dispose()
        $codigo = $proceso.ExitCode
        $refProceso.Value = $null
        if ($codigo -eq 0) {
            Escribir-Registro "$etiqueta instalado correctamente."
        } else {
            $salidaError = $proceso.StandardError.ReadToEnd()
            Escribir-Registro "No se pudo instalar $etiqueta automaticamente (codigo $codigo). Prueba el boton de la pagina de descarga."
            if ($salidaError) { Escribir-Registro $salidaError.Trim() }
        }
        $boton.Enabled = $true
        Refrescar-Estado
    }.GetNewClosure())
    $temporizador.Start()
}

# ------------------------------------------------------------------
# Botones
# ------------------------------------------------------------------

$botonNode.Add_Click({
    if (Hay-Winget) {
        $botonNode.Enabled = $false
        Escribir-Registro "Instalando Node.js... puede tardar unos minutos y puede pedir permiso de administrador (acepta el aviso de Windows si aparece)."
        $info = New-Object System.Diagnostics.ProcessStartInfo
        $info.FileName = "winget"
        $info.Arguments = "install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements --silent"
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        $proceso = New-Object System.Diagnostics.Process
        $proceso.StartInfo = $info
        try {
            $proceso.Start() | Out-Null
            $script:procesoNode = $proceso
            Vigilar-Instalacion $proceso "Node.js" ([ref]$script:procesoNode) $botonNode
        } catch {
            Escribir-Registro ("No se pudo lanzar winget: " + $_.Exception.Message)
            $botonNode.Enabled = $true
        }
    } else {
        Escribir-Registro "Este PC no tiene winget. Abre la pagina de descarga y sigue sus instrucciones."
        [System.Windows.Forms.MessageBox]::Show(
            "Este PC no tiene winget instalado.`n`nUsa el boton `"Abrir pagina de descarga`": ahi tienes el enlace para instalar Node.js a mano (pulsa el boton `"LTS`" y sigue el instalador).",
            "GMM Server", "OK", "Warning") | Out-Null
    }
})

$botonNodePagina.Add_Click({
    Escribir-Registro "Abriendo la pagina de descarga de Node.js. Pulsa el boton `"LTS`" y sigue el instalador dandole a Siguiente hasta el final."
    Start-Process "https://nodejs.org"
})

$botonFFmpeg.Add_Click({
    if (Hay-Winget) {
        $botonFFmpeg.Enabled = $false
        Escribir-Registro "Instalando FFmpeg... puede tardar varios minutos y puede pedir permiso de administrador (acepta el aviso de Windows si aparece)."
        $info = New-Object System.Diagnostics.ProcessStartInfo
        $info.FileName = "winget"
        $info.Arguments = "install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements --silent"
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        $proceso = New-Object System.Diagnostics.Process
        $proceso.StartInfo = $info
        try {
            $proceso.Start() | Out-Null
            $script:procesoFFmpeg = $proceso
            Vigilar-Instalacion $proceso "FFmpeg" ([ref]$script:procesoFFmpeg) $botonFFmpeg
        } catch {
            Escribir-Registro ("No se pudo lanzar winget: " + $_.Exception.Message)
            $botonFFmpeg.Enabled = $true
        }
    } else {
        Escribir-Registro "Este PC no tiene winget. Abre la pagina de descarga y sigue sus instrucciones."
        [System.Windows.Forms.MessageBox]::Show(
            "Este PC no tiene winget instalado.`n`nUsa el boton `"Abrir pagina de descarga`": ahi tienes el enlace y los pasos para instalar FFmpeg a mano.",
            "GMM Server", "OK", "Warning") | Out-Null
    }
})

$botonFFmpegPagina.Add_Click({
    Escribir-Registro "Abriendo la pagina de descarga de FFmpeg. Baja el paquete `"release essentials`", descomprimelo, y anade su carpeta `"bin`" al PATH (o apunta a ffmpeg.exe/ffprobe.exe con rutaFFmpeg/rutaFFprobe en PRIVADO/configuracion.json)."
    Start-Process "https://www.gyan.dev/ffmpeg/builds/"
})

$botonTailscale.Add_Click({
    if (Hay-Winget) {
        $botonTailscale.Enabled = $false
        Escribir-Registro "Instalando Tailscale... puede tardar unos minutos y puede pedir permiso de administrador (acepta el aviso de Windows si aparece)."
        $info = New-Object System.Diagnostics.ProcessStartInfo
        $info.FileName = "winget"
        $info.Arguments = "install --id Tailscale.Tailscale -e --accept-package-agreements --accept-source-agreements --silent"
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        $proceso = New-Object System.Diagnostics.Process
        $proceso.StartInfo = $info
        try {
            $proceso.Start() | Out-Null
            $script:procesoTailscale = $proceso
            Vigilar-Instalacion $proceso "Tailscale" ([ref]$script:procesoTailscale) $botonTailscale
        } catch {
            Escribir-Registro ("No se pudo lanzar winget: " + $_.Exception.Message)
            $botonTailscale.Enabled = $true
        }
    } else {
        Escribir-Registro "Este PC no tiene winget. Se abre la pagina de Tailscale para instalarlo a mano."
        Start-Process "https://tailscale.com/download"
    }
})

$botonTailscaleAbrir.Add_Click({
    Escribir-Registro "Abriendo Tailscale para iniciar sesion. Si no aparece nada, busca el icono de Tailscale en la bandeja del sistema (junto al reloj) o en el menu Inicio."
    $rutaApp = Join-Path $env:ProgramFiles "Tailscale\tailscale-ipn.exe"
    if (Test-Path $rutaApp) {
        Start-Process $rutaApp
    } else {
        try { Start-Process "tailscale-ipn" } catch { Start-Process "https://tailscale.com/download" }
    }
})

$botonTailscaleMovil.Add_Click({
    Escribir-Registro "Abriendo la pagina de Tailscale para instalarlo en tu TELEFONO (no hace falta para este PC, que ya quedo instalado con el boton de arriba). Instala la app en el movil e inicia sesion con la MISMA cuenta que en el PC."
    Start-Process "https://tailscale.com/download"
})

$botonCerrar.Add_Click({ $forma.Close() })

# ------------------------------------------------------------------
# Arranque
# ------------------------------------------------------------------

Escribir-Registro "Listo. Instala lo que te falte con los botones de arriba."
Refrescar-Estado
[System.Windows.Forms.Application]::Run($forma)
