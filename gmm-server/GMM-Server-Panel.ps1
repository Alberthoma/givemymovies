<#
    GMM-Server-Panel.ps1

    Aplicacion de escritorio para GMM Server: iniciar y detener el servidor,
    anadir o quitar carpetas con el selector nativo de Windows, escanear sin
    reiniciar, y ocultarse en la bandeja del sistema mientras corre en
    segundo plano.

    No se abre a mano: hazlo con doble clic en GMM-Server.vbs, en esta misma
    carpeta, que la lanza sin ventanas negras de por medio.
#>

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName Microsoft.VisualBasic

# Lanzar powershell.exe ya oculto (-WindowStyle Hidden) hace que la PRIMERA
# ventana que cree el proceso -el propio formulario- tambien nazca oculta:
# es un problema conocido de Windows con el estado inicial heredado del
# proceso. Por eso el lanzador (GMM-Server.vbs) abre PowerShell normal, y es
# el propio script el que se oculta la consola a si mismo aqui, ya en marcha:
# el formulario, al crearse despues, sale visible sin problema.
Add-Type -Name Consola -Namespace GmmServer -MemberDefinition '
    [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
'
$ventanaConsola = [GmmServer.Consola]::GetConsoleWindow()
if ($ventanaConsola -ne [IntPtr]::Zero) { [GmmServer.Consola]::ShowWindow($ventanaConsola, 0) | Out-Null }

# Solo una copia de la app a la vez: si ya hay una abierta (visible o en la
# bandeja) y el usuario vuelve a hacer doble clic en el lanzador sin darse
# cuenta, esta segunda copia se cierra sola en vez de intentar arrancar OTRO
# servidor en el mismo puerto (eso fallaba con "EADDRINUSE" y confundia,
# ademas de dejar procesos sueltos que ni la primera copia sabe manejar).
$script:nombreExclusivo = "Local\GMM-Server-Panel-Instancia-Unica"
$script:esPrimeraInstancia = $false
$script:mutexUnico = New-Object System.Threading.Mutex($true, $script:nombreExclusivo, [ref]$script:esPrimeraInstancia)
if (-not $script:esPrimeraInstancia) {
    [System.Windows.Forms.MessageBox]::Show(
        "GMM Server ya esta abierto. Revisa la bandeja del sistema (junto al reloj), " +
        "puede que este ahi oculto en vez de en una ventana.",
        "GMM Server", "OK", "Information") | Out-Null
    exit
}

$raiz = $PSScriptRoot
$rutaConfig = Join-Path $raiz "PRIVADO\configuracion.json"
$rutaPreparar = Join-Path $raiz "preparar.js"
$rutaServidor = Join-Path $raiz "servidor.js"

$script:proceso = $null
$script:config = $null
$script:cerrandoDeVerdad = $false

# ------------------------------------------------------------------
# Configuracion
# ------------------------------------------------------------------

function Cargar-Config {
    if (-not (Test-Path $rutaConfig)) { return $null }
    $texto = [System.IO.File]::ReadAllText($rutaConfig, [System.Text.Encoding]::UTF8)
    $config = $texto | ConvertFrom-Json
    if ($null -eq $config.carpetas) {
        $config | Add-Member -MemberType NoteProperty -Name carpetas -Value @() -Force
    } else {
        $config.carpetas = @($config.carpetas)
    }
    return $config
}

function Guardar-Config($config) {
    $copia = $config | Select-Object *
    $copia.carpetas = @($config.carpetas)
    $json = $copia | ConvertTo-Json -Depth 10
    $codificacion = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($rutaConfig, $json, $codificacion)
}

# ------------------------------------------------------------------
# Formulario principal
# ------------------------------------------------------------------

$forma = New-Object System.Windows.Forms.Form
$forma.Text = "GMM Server"
$forma.Size = New-Object System.Drawing.Size(560, 520)
$forma.StartPosition = "CenterScreen"
$forma.FormBorderStyle = "FixedDialog"
$forma.MaximizeBox = $false

$etiquetaEstado = New-Object System.Windows.Forms.Label
$etiquetaEstado.Text = "Detenido"
$etiquetaEstado.ForeColor = [System.Drawing.Color]::Firebrick
$etiquetaEstado.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$etiquetaEstado.Location = New-Object System.Drawing.Point(20, 15)
$etiquetaEstado.Size = New-Object System.Drawing.Size(520, 28)
$forma.Controls.Add($etiquetaEstado)

$botonIniciar = New-Object System.Windows.Forms.Button
$botonIniciar.Text = "Iniciar servidor"
$botonIniciar.Location = New-Object System.Drawing.Point(20, 50)
$botonIniciar.Size = New-Object System.Drawing.Size(160, 32)
$forma.Controls.Add($botonIniciar)

$botonEscanear = New-Object System.Windows.Forms.Button
$botonEscanear.Text = "Escanear ahora"
$botonEscanear.Location = New-Object System.Drawing.Point(190, 50)
$botonEscanear.Size = New-Object System.Drawing.Size(160, 32)
$botonEscanear.Enabled = $false
$forma.Controls.Add($botonEscanear)

$etiquetaClaveTit = New-Object System.Windows.Forms.Label
$etiquetaClaveTit.Text = "Clave de administracion:"
$etiquetaClaveTit.Location = New-Object System.Drawing.Point(20, 95)
$etiquetaClaveTit.Size = New-Object System.Drawing.Size(180, 20)
$forma.Controls.Add($etiquetaClaveTit)

$campoClave = New-Object System.Windows.Forms.TextBox
$campoClave.Location = New-Object System.Drawing.Point(20, 117)
$campoClave.Size = New-Object System.Drawing.Size(400, 22)
$campoClave.ReadOnly = $true
$forma.Controls.Add($campoClave)

$botonCopiarClave = New-Object System.Windows.Forms.Button
$botonCopiarClave.Text = "Copiar"
$botonCopiarClave.Location = New-Object System.Drawing.Point(430, 116)
$botonCopiarClave.Size = New-Object System.Drawing.Size(90, 24)
$forma.Controls.Add($botonCopiarClave)

$etiquetaCarpetas = New-Object System.Windows.Forms.Label
$etiquetaCarpetas.Text = "Carpetas que escanea:"
$etiquetaCarpetas.Location = New-Object System.Drawing.Point(20, 155)
$etiquetaCarpetas.Size = New-Object System.Drawing.Size(300, 20)
$forma.Controls.Add($etiquetaCarpetas)

$listaCarpetas = New-Object System.Windows.Forms.ListView
$listaCarpetas.Location = New-Object System.Drawing.Point(20, 178)
$listaCarpetas.Size = New-Object System.Drawing.Size(500, 110)
$listaCarpetas.View = "Details"
$listaCarpetas.FullRowSelect = $true
$listaCarpetas.Columns.Add("Nombre", 140) | Out-Null
$listaCarpetas.Columns.Add("Ruta", 340) | Out-Null
$forma.Controls.Add($listaCarpetas)

$botonAnadirCarpeta = New-Object System.Windows.Forms.Button
$botonAnadirCarpeta.Text = "Anadir carpeta..."
$botonAnadirCarpeta.Location = New-Object System.Drawing.Point(20, 296)
$botonAnadirCarpeta.Size = New-Object System.Drawing.Size(160, 30)
$forma.Controls.Add($botonAnadirCarpeta)

$botonQuitarCarpeta = New-Object System.Windows.Forms.Button
$botonQuitarCarpeta.Text = "Quitar carpeta"
$botonQuitarCarpeta.Location = New-Object System.Drawing.Point(190, 296)
$botonQuitarCarpeta.Size = New-Object System.Drawing.Size(160, 30)
$forma.Controls.Add($botonQuitarCarpeta)

$etiquetaRegistro = New-Object System.Windows.Forms.Label
$etiquetaRegistro.Text = "Actividad:"
$etiquetaRegistro.Location = New-Object System.Drawing.Point(20, 338)
$etiquetaRegistro.Size = New-Object System.Drawing.Size(200, 20)
$forma.Controls.Add($etiquetaRegistro)

$cajaRegistro = New-Object System.Windows.Forms.TextBox
$cajaRegistro.Location = New-Object System.Drawing.Point(20, 360)
$cajaRegistro.Size = New-Object System.Drawing.Size(500, 100)
$cajaRegistro.Multiline = $true
$cajaRegistro.ReadOnly = $true
$cajaRegistro.ScrollBars = "Vertical"
$cajaRegistro.Font = New-Object System.Drawing.Font("Consolas", 9)
$forma.Controls.Add($cajaRegistro)

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
# Icono de la bandeja del sistema
# ------------------------------------------------------------------

$iconoBandeja = New-Object System.Windows.Forms.NotifyIcon
$iconoBandeja.Icon = [System.Drawing.SystemIcons]::Application
$iconoBandeja.Text = "GMM Server"
$iconoBandeja.Visible = $false

$menuBandeja = New-Object System.Windows.Forms.ContextMenuStrip
$itemMostrar = $menuBandeja.Items.Add("Mostrar GMM Server")
$itemDetenerYSalir = $menuBandeja.Items.Add("Detener servidor y salir")
$iconoBandeja.ContextMenuStrip = $menuBandeja

$itemMostrar.Add_Click({
    $forma.Show()
    $forma.WindowState = "Normal"
    $forma.Activate()
    $iconoBandeja.Visible = $false
})
$iconoBandeja.Add_DoubleClick({
    $forma.Show()
    $forma.WindowState = "Normal"
    $forma.Activate()
    $iconoBandeja.Visible = $false
})

# ------------------------------------------------------------------
# Refrescar la interfaz segun el estado
# ------------------------------------------------------------------

function Refrescar-ListaCarpetas {
    $listaCarpetas.Items.Clear()
    foreach ($carpeta in @($script:config.carpetas)) {
        $item = New-Object System.Windows.Forms.ListViewItem($carpeta.nombre)
        $item.SubItems.Add($carpeta.ruta) | Out-Null
        $listaCarpetas.Items.Add($item) | Out-Null
    }
}

function Refrescar-Interfaz {
    $encendido = ($null -ne $script:proceso) -and (-not $script:proceso.HasExited)
    if ($encendido) {
        $etiquetaEstado.Text = "Encendido - http://$($script:config.host):$($script:config.puerto)"
        $etiquetaEstado.ForeColor = [System.Drawing.Color]::SeaGreen
        $botonIniciar.Text = "Detener servidor"
        $botonEscanear.Enabled = $true
    } else {
        $etiquetaEstado.Text = "Detenido"
        $etiquetaEstado.ForeColor = [System.Drawing.Color]::Firebrick
        $botonIniciar.Text = "Iniciar servidor"
        $botonEscanear.Enabled = $false
    }
    $botonAnadirCarpeta.Enabled = -not $encendido
    $botonQuitarCarpeta.Enabled = -not $encendido
}

# ------------------------------------------------------------------
# Iniciar / detener el servidor
# ------------------------------------------------------------------

function Iniciar-Servidor {
    if ($null -ne $script:proceso -and -not $script:proceso.HasExited) { return }

    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = "node.exe"
    $info.Arguments = "`"$rutaServidor`""
    $info.WorkingDirectory = $raiz
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $info.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $proceso = New-Object System.Diagnostics.Process
    $proceso.StartInfo = $info
    $proceso.EnableRaisingEvents = $true

    $script:suscripciones = @(
        (Register-ObjectEvent -InputObject $proceso -EventName OutputDataReceived -Action {
            if ($Event.SourceEventArgs.Data) { Escribir-Registro $Event.SourceEventArgs.Data }
        }),
        (Register-ObjectEvent -InputObject $proceso -EventName ErrorDataReceived -Action {
            if ($Event.SourceEventArgs.Data) { Escribir-Registro ("ERROR: " + $Event.SourceEventArgs.Data) }
        })
    )

    try {
        $proceso.Start() | Out-Null
        $proceso.BeginOutputReadLine()
        $proceso.BeginErrorReadLine()
        $script:proceso = $proceso
        Escribir-Registro "Iniciando servidor (PID $($proceso.Id))..."
    } catch {
        [System.Windows.Forms.MessageBox]::Show(
            "No se pudo iniciar el servidor. Revisa que Node.js este instalado y disponible.`n`n" + $_.Exception.Message,
            "GMM Server", "OK", "Error") | Out-Null
    }
    Refrescar-Interfaz

    # No basta con que Start() no lance error: si el puerto ya esta ocupado
    # (por ejemplo, otra copia de GMM Server corriendo por fuera de esta
    # app), node.exe arranca y se cae solo un instante despues. Se comprueba
    # sin bloquear la ventana, con un temporizador de un solo disparo.
    $comprobacion = New-Object System.Windows.Forms.Timer
    $comprobacion.Interval = 900
    $comprobacion.Add_Tick({
        $comprobacion.Stop()
        $comprobacion.Dispose()
        if ($null -ne $script:proceso -and $script:proceso.HasExited) {
            Escribir-Registro "El servidor se cerro solo justo despues de arrancar (revisa el registro de arriba: normalmente es el puerto ya ocupado por otra copia)."
            $script:proceso = $null
            Refrescar-Interfaz
        }
    })
    $comprobacion.Start()
}

function Detener-Servidor {
    if ($null -eq $script:proceso -or $script:proceso.HasExited) { $script:proceso = $null; Refrescar-Interfaz; return }
    try {
        Stop-Process -Id $script:proceso.Id -Force -ErrorAction Stop
        Escribir-Registro "Servidor detenido."
    } catch {
        Escribir-Registro ("No se pudo detener el servidor: " + $_.Exception.Message)
    }
    if ($script:suscripciones) {
        $script:suscripciones | Unregister-Event -ErrorAction SilentlyContinue
        $script:suscripciones = $null
    }
    $script:proceso = $null
    Refrescar-Interfaz
}

$botonIniciar.Add_Click({
    if ($null -ne $script:proceso -and -not $script:proceso.HasExited) {
        Detener-Servidor
    } else {
        Iniciar-Servidor
    }
})

$itemDetenerYSalir.Add_Click({
    $script:cerrandoDeVerdad = $true
    $forma.Close()
})

# ------------------------------------------------------------------
# Escanear ahora, sin reiniciar (usa el endpoint que ya tiene GMM Server)
# ------------------------------------------------------------------

$botonEscanear.Add_Click({
    if ($null -eq $script:proceso -or $script:proceso.HasExited) { return }
    $botonEscanear.Enabled = $false
    Escribir-Registro "Escaneando..."
    try {
        $uri = "http://$($script:config.host):$($script:config.puerto)/api/escanear"
        $resultado = Invoke-RestMethod -Method Post -Uri $uri -Headers @{ Authorization = "Bearer $($script:config.claveAdministracion)" }
        Escribir-Registro ("Listo: $($resultado.resumen.total) pelicula(s), $($resultado.resumen.disponibles) disponible(s), $($resultado.resumen.copiandose) copiandose todavia.")
    } catch {
        Escribir-Registro ("No se pudo escanear: " + $_.Exception.Message)
    }
    $botonEscanear.Enabled = $true
})

# ------------------------------------------------------------------
# Anadir / quitar carpetas
# ------------------------------------------------------------------

$botonAnadirCarpeta.Add_Click({
    $dialogo = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialogo.Description = "Elige la carpeta con tus peliculas o series"
    $dialogo.ShowNewFolderButton = $false
    if ($dialogo.ShowDialog() -ne "OK") { return }

    $ruta = $dialogo.SelectedPath
    $nombrePorDefecto = Split-Path -Path $ruta -Leaf
    $nombre = [Microsoft.VisualBasic.Interaction]::InputBox(
        "Nombre para esta carpeta (solo para identificarla en la lista):", "Anadir carpeta", $nombrePorDefecto)
    if ([string]::IsNullOrWhiteSpace($nombre)) { $nombre = $nombrePorDefecto }

    $yaExiste = @($script:config.carpetas) | Where-Object {
        $_.ruta.ToLowerInvariant() -eq $ruta.ToLowerInvariant() -or
        $_.nombre.ToLowerInvariant() -eq $nombre.ToLowerInvariant()
    }
    if ($yaExiste) {
        [System.Windows.Forms.MessageBox]::Show(
            "Ya hay una carpeta guardada con ese nombre o esa ruta.", "GMM Server", "OK", "Warning") | Out-Null
        return
    }

    $nueva = [PSCustomObject]@{ nombre = $nombre; ruta = $ruta }
    $script:config.carpetas = @($script:config.carpetas) + $nueva
    Guardar-Config $script:config
    Refrescar-ListaCarpetas
    Escribir-Registro "Carpeta anadida: $nombre ($ruta). Reinicia el servidor para que la lea."
})

$botonQuitarCarpeta.Add_Click({
    if ($listaCarpetas.SelectedItems.Count -eq 0) { return }
    $seleccionada = $listaCarpetas.SelectedItems[0].Text
    $confirmar = [System.Windows.Forms.MessageBox]::Show(
        "Quitar la carpeta `"$seleccionada`" de la lista? Esto no borra tus peliculas, solo deja de leer esa carpeta.",
        "GMM Server", "YesNo", "Question")
    if ($confirmar -ne "Yes") { return }

    $script:config.carpetas = @($script:config.carpetas) | Where-Object { $_.nombre -ne $seleccionada }
    Guardar-Config $script:config
    Refrescar-ListaCarpetas
    Escribir-Registro "Carpeta quitada: $seleccionada. Reinicia el servidor para aplicarlo."
})

$botonCopiarClave.Add_Click({
    if ($campoClave.Text) {
        [System.Windows.Forms.Clipboard]::SetText($campoClave.Text)
        Escribir-Registro "Clave copiada al portapapeles."
    }
})

# ------------------------------------------------------------------
# Cerrar la ventana oculta a la bandeja si el servidor sigue encendido
# ------------------------------------------------------------------

$forma.Add_FormClosing({
    param($origen, $eventoArgs)
    $encendido = ($null -ne $script:proceso) -and (-not $script:proceso.HasExited)
    if ($encendido -and -not $script:cerrandoDeVerdad) {
        $eventoArgs.Cancel = $true
        $forma.Hide()
        $iconoBandeja.Visible = $true
        $iconoBandeja.ShowBalloonTip(2000, "GMM Server", "Sigue encendido en segundo plano.", "Info")
        return
    }
    if ($encendido -and $script:cerrandoDeVerdad) {
        Detener-Servidor
    }
    $iconoBandeja.Visible = $false
})

# ------------------------------------------------------------------
# Arranque
# ------------------------------------------------------------------

$script:config = Cargar-Config
if ($null -eq $script:config) {
    [System.Windows.Forms.MessageBox]::Show(
        "Todavia no existe la configuracion de GMM Server (PRIVADO\configuracion.json).`n`n" +
        "Abre PowerShell en la carpeta gmm-server y ejecuta una vez:`n`n    npm.cmd run configurar`n`n" +
        "Despues vuelve a abrir esta aplicacion.",
        "GMM Server", "OK", "Warning") | Out-Null
    exit
}

$campoClave.Text = $script:config.claveAdministracion
Refrescar-ListaCarpetas
Refrescar-Interfaz

[System.Windows.Forms.Application]::Run($forma)
$iconoBandeja.Visible = $false
$iconoBandeja.Dispose()
