from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, Paragraph, Spacer, Image as RLImage, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

ROOT = Path(__file__).parent
ASSETS = ROOT / "assets"
TEMP = Path(r"C:\Users\Albert\AppData\Local\Temp")
PDF_PATH = ROOT / "Guia-visual-compartir-GMM-por-Tailscale-v2.pdf"

SOURCE = {
    "01_machines.png": "codex-clipboard-68fc4476-c21c-42ed-ad72-ef0785ab06f3.png",
    "02_share_menu.png": "codex-clipboard-91db3052-b12a-4ff6-85cc-4595851ae798.png",
    "03_first_email.png": "codex-clipboard-17ed8812-1e1f-4a12-9560-4552597ef486.png",
    "04_login.png": "codex-clipboard-092f35f6-c84f-4508-98da-0bd6d1b4f79b.png",
    "05_onboarding_bottom.png": "codex-clipboard-5ed9561f-2554-41bd-b710-819ecccd9f9f.png",
    "06_user_management.png": "codex-clipboard-615f7780-d587-4555-b5f5-8df3761daaab.png",
    "07_second_email.png": "codex-clipboard-17ed8812-1e1f-4a12-9560-4552597ef486.png",
    "08_accept_share.png": "codex-clipboard-335c4e76-4e29-4e67-b4f6-b6b3bc10d383.png",
    "09_shared_in.png": "codex-clipboard-d49b8473-8eb0-4b34-8f68-e3f1c8dff048.png",
    "10_logout_old.png": "codex-clipboard-d55ef148-71cf-4916-b73b-c4901bacf3de.png",
    "11_phone_login.png": "codex-clipboard-f3b3b4de-9f89-4a8b-b26f-360d2de99b40.png",
    "12_google_account.png": "codex-clipboard-f2d2edfe-dd7c-4e8d-b9fd-af185d9cd66d.png",
    "13_connect_phone.png": "codex-clipboard-f5ff5e6a-8a11-4812-a30f-9ed7a42f1fc0.png",
    "14_phone_success.png": "codex-clipboard-709a123f-b995-40a5-a245-eaa716a9ae97.png",
    "15_phone_ready.png": "codex-clipboard-66b654dc-96fc-46b7-88a1-c2ae9bef66e1.png",
}

STEPS = [
    {
        "number": "01", "asset": "01_machines.png", "where": "PC del propietario · consola de Tailscale",
        "title": "Encuentra el PC que comparte las películas",
        "action": "En Network → Machines, localiza el PC de GMM Server. Es la fila con Windows y el punto verde. Pulsa los tres puntos (…) al extremo derecho de esa fila.",
        "note": "No selecciones el iPhone. El equipo correcto es el PC donde está encendido GMM Server.",
        "highlight": (1710, 455, 93, 95, "1. TOCA LOS TRES PUNTOS"),
    },
    {
        "number": "02", "asset": "02_share_menu.png", "where": "PC del propietario · cuadro Share machine",
        "title": "Crea una invitación nueva para la otra cuenta",
        "action": "En la ventana Share machine elige Share via email. Escribe el correo de la nueva persona y pulsa Share. Si usarás enlace, elige Copy share link y genera uno nuevo.",
        "note": "Para una cuenta concreta, Share via email es la opción más clara. Nunca reutilices un enlace que ya revocaste.",
        "highlight": (604, 347, 173, 48, "2. SHARE VIA EMAIL"),
    },
    {
        "number": "03", "asset": "03_first_email.png", "where": "PC de la cuenta invitada · Chrome en incógnito",
        "title": "Abre el correo y acepta por primera vez",
        "action": "Abre una ventana de incógnito. Entra a Gmail con la cuenta invitada, abre el mensaje de Tailscale y pulsa Accept device invite.",
        "note": "La ventana de incógnito evita que Chrome use accidentalmente tu sesión personal de Google.",
        "highlight": (990, 900, 350, 105, "3. PRIMERA ACEPTACION"),
    },
    {
        "number": "04", "asset": "04_login.png", "where": "PC de la cuenta invitada · Chrome en incógnito",
        "title": "Inicia sesión como la cuenta invitada",
        "action": "Pulsa Sign in with Google y elige exactamente la nueva cuenta de Gmail. Si aparece otro correo, no continúes: vuelve atrás y cambia de cuenta.",
        "note": "Esta cuenta puede tener su propio tailnet; no hace falta agregarla como Member de tu tailnet.",
        "highlight": (659, 576, 563, 71, "4. SIGN IN WITH GOOGLE"),
    },
    {
        "number": "05", "asset": "05_onboarding_bottom.png", "where": "PC de la cuenta invitada · pantalla automática de Tailscale",
        "title": "Baja hasta el final de la pantalla “Next, add a second device”",
        "action": "Después de iniciar sesión aparece esta pantalla automáticamente. Desplázate hasta el fondo, donde ves el dispositivo conectado y el mensaje Waiting for your second device.",
        "note": "No necesitas agregar otro PC ni descargar nada aquí. Es una pantalla de bienvenida normal: solo llega al final y continúa.",
        "highlight": (630, 804, 585, 104, "5. LLEGA HASTA EL FONDO"),
    },
    {
        "number": "06", "asset": "06_user_management.png", "where": "PC de la cuenta invitada · consola de Tailscale",
        "title": "Si llegas a User management, no cambies nada",
        "action": "Esta pantalla puede abrirse al entrar a la consola. No pulses el interruptor Manually approve new users y no modifiques Identity Provider. Regresa al correo de Gmail.",
        "note": "Esta pantalla no acepta el PC compartido. El paso decisivo sigue siendo volver al mismo correo y aceptar la invitación una segunda vez.",
        "highlight": (486, 899, 464, 42, "6. NO CAMBIES ESTE INTERRUPTOR"),
    },
    {
        "number": "07", "asset": "07_second_email.png", "where": "PC de la cuenta invitada · vuelve a Gmail en incógnito",
        "title": "Vuelve al mismo correo y acepta por segunda vez",
        "action": "Regresa al mensaje original de Tailscale. Pulsa otra vez Accept device invite. Esta segunda pulsación es necesaria después de haber creado la sesión de Tailscale.",
        "note": "No busques un correo nuevo: usa el mismo mensaje de invitación que ya estaba abierto.",
        "highlight": (990, 900, 350, 105, "7. SEGUNDA ACEPTACION"),
    },
    {
        "number": "08", "asset": "08_accept_share.png", "where": "PC de la cuenta invitada · confirmación final de Tailscale",
        "title": "Ahora sí: acepta la invitación del PC compartido",
        "action": "En esta pantalla baja hasta el fondo y pulsa Accept invite, abajo a la derecha. Antes confirma que la tarjeta corresponde al PC Windows que comparte las películas.",
        "note": "Este botón final concede acceso solo a ese PC, no a toda tu red personal de Tailscale.",
        "highlight": (1188, 996, 194, 65, "8. ACCEPT INVITE"),
    },
    {
        "number": "09", "asset": "09_shared_in.png", "where": "PC de la cuenta invitada · consola de Tailscale",
        "title": "Comprueba que el PC ya aparece como compartido",
        "action": "En Machines busca el filtro Shared with me / Shared in. Debe aparecer una máquina: el PC Windows del propietario, con la etiqueta Shared in.",
        "note": "Solo después de esta comprobación pasa al iPhone.",
        "highlight": (485, 387, 403, 58, "9. SHARED WITH ME"),
    },
    {
        "number": "10", "asset": "10_logout_old.png", "where": "iPhone · app Tailscale",
        "title": "Cierra la cuenta anterior del iPhone",
        "action": "En la app Tailscale abre la lista de Accounts y toca Log Out. Así el teléfono deja de estar conectado con tu cuenta personal.",
        "note": "No borres ni muevas el PC Windows. Solo cambia la cuenta usada dentro de la app Tailscale del iPhone.",
        "phone": True,
        "highlight": (60, 842, 600, 65, "10. LOG OUT"),
    },
    {
        "number": "11", "asset": "11_phone_login.png", "where": "iPhone · inicio de sesión de Tailscale",
        "title": "Inicia sesión desde el iPhone",
        "action": "Toca Sign in with Google. No escribas ni confirmes el correo del propietario: usarás la cuenta que recibió la invitación.",
        "note": "La misma cuenta debe usarse en el PC de incógnito y en este iPhone.",
        "phone": True,
        "highlight": (55, 872, 630, 84, "11. SIGN IN WITH GOOGLE"),
    },
    {
        "number": "12", "asset": "12_google_account.png", "where": "iPhone · selector de Google",
        "title": "Elige la cuenta invitada",
        "action": "En Selecciona una cuenta, toca la cuenta invitada. Si no aparece, toca Usar otra cuenta e inicia sesión con ese Gmail.",
        "note": "No elijas tu cuenta personal de propietario en esta pantalla.",
        "phone": True,
        "highlight": (48, 760, 640, 118, "12. CUENTA INVITADA"),
    },
    {
        "number": "13", "asset": "13_connect_phone.png", "where": "iPhone · autorización de Tailscale",
        "title": "Conecta este iPhone a la cuenta invitada",
        "action": "Verifica que el correo visible sea el de la cuenta invitada. Pulsa Connect para agregar el iPhone a su propio tailnet.",
        "note": "Este paso solo conecta el iPhone de la persona invitada; el PC seguirá siendo compartido desde tu cuenta personal.",
        "phone": True,
        "highlight": (70, 770, 600, 90, "13. CONNECT"),
    },
    {
        "number": "14", "asset": "14_phone_success.png", "where": "iPhone · confirmación de inicio de sesión",
        "title": "Espera la confirmación “Login successful”",
        "action": "La pantalla debe indicar que el iPhone inició sesión en el tailnet de la cuenta invitada. Espera a que vuelva a la app Tailscale.",
        "note": "El icono VPN de iPhone aparecerá al estar activa la conexión.",
        "phone": True,
        "highlight": (190, 585, 410, 75, "14. LOGIN SUCCESSFUL"),
    },
    {
        "number": "15", "asset": "15_phone_ready.png", "where": "iPhone · app Tailscale",
        "title": "Confirma que el PC compartido está verde",
        "action": "Activa el interruptor superior si hace falta. Debajo de la cuenta invitada debe aparecer el PC compartido con punto verde.",
        "note": "Cuando el PC está verde, Tailscale ya está listo para GiveMyMovies.",
        "phone": True,
        "highlight": (64, 700, 610, 118, "15. PC COMPARTIDO EN VERDE"),
    },
]

def font(size: int):
    for candidate in (r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\segoeui.ttf"):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()

def redact(draw: ImageDraw.ImageDraw, box, label: str):
    x, y, w, h = box
    draw.rounded_rectangle((x, y, x+w, y+h), radius=10, fill=(22, 24, 29), outline=(96, 103, 119), width=2)
    draw.text((x+10, y+max(3, (h-22)//2)), label, fill=(235, 239, 247), font=font(18))

def make_assets():
    ASSETS.mkdir(parents=True, exist_ok=True)
    for item in STEPS:
        source = TEMP / SOURCE[item["asset"]]
        target = ASSETS / item["asset"]
        im = Image.open(source).convert("RGB")
        draw = ImageDraw.Draw(im)
        name = item["asset"]
        # Hide personal account identifiers, network/IP details and one-time invitation data.
        if name == "01_machines.png":
            redact(draw, (55, 10, 285, 52), "[cuenta propietaria]")
            redact(draw, (470, 535, 370, 37), "[correo del propietario]")
            redact(draw, (470, 675, 370, 37), "[correo del propietario]")
        elif name == "02_share_menu.png":
            redact(draw, (50, 5, 310, 56), "[cuenta propietaria]")
            redact(draw, (552, 600, 610, 50), "[enlace o código de invitación oculto]")
        elif name in ("03_first_email.png", "07_second_email.png"):
            redact(draw, (860, 455, 400, 52), "[correo del propietario]")
            redact(draw, (805, 505, 380, 52), "[tailnet del propietario]")
            redact(draw, (680, 720, 390, 52), "[PC compartido]")
        elif name == "05_onboarding_bottom.png":
            redact(draw, (640, 813, 570, 80), "[dispositivo e IP privados]")
        elif name == "06_user_management.png":
            redact(draw, (75, 176, 270, 52), "[cuenta invitada]")
            redact(draw, (620, 600, 380, 60), "[identificador privado]")
        elif name == "08_accept_share.png":
            redact(draw, (220, 0, 1100, 45), "[enlace de invitación oculto]")
            redact(draw, (620, 184, 670, 88), "[cuenta del propietario]")
        elif name == "09_shared_in.png":
            redact(draw, (55, 120, 275, 48), "[cuenta invitada]")
            redact(draw, (486, 728, 360, 40), "[correo del propietario]")
        elif name == "10_logout_old.png":
            redact(draw, (175, 330, 485, 180), "[cuenta anterior]")
        elif name == "11_phone_login.png":
            redact(draw, (55, 568, 630, 95), "[correo de la cuenta anterior]")
        elif name == "12_google_account.png":
            redact(draw, (117, 780, 500, 95), "[cuenta invitada]")
        elif name == "13_connect_phone.png":
            redact(draw, (298, 305, 300, 58), "[cuenta invitada]")
        elif name == "14_phone_success.png":
            redact(draw, (298, 305, 300, 58), "[cuenta invitada]")
        elif name == "15_phone_ready.png":
            redact(draw, (78, 95, 450, 58), "[cuenta invitada]")
            redact(draw, (75, 405, 260, 55), "[cuenta invitada]")
            redact(draw, (75, 560, 320, 54), "[IP privada del iPhone]")
            redact(draw, (75, 630, 330, 56), "[PC compartido]")
            redact(draw, (76, 707, 580, 62), "NOMBRE-DEL-PC.tailnet.ts.net")
            redact(draw, (75, 757, 300, 54), "[IP privada]")
        x, y, w, h, label = item["highlight"]
        # Fit coordinates proportionally to the actual screenshot dimensions.
        natural_sizes = {
            "03_first_email.png": (1912, 1178),
            "05_onboarding_bottom.png": (1894, 1029),
            "06_user_management.png": (1919, 1195),
            "07_second_email.png": (1912, 1178),
            "08_accept_share.png": (1904, 1086),
        }
        base_w, base_h = natural_sizes.get(name, (738, 1600) if item.get("phone") else (1920, 1080))
        sx, sy = im.width / base_w, im.height / base_h
        x, y, w, h = [int(v) for v in (x*sx, y*sy, w*sx, h*sy)]
        pad = max(7, int(10*min(sx, sy)))
        draw.rounded_rectangle((x-pad, y-pad, x+w+pad, y+h+pad), radius=16, outline=(56, 123, 255), width=max(4, int(6*min(sx, sy))))
        tag_h = max(33, int(39*min(sx, sy)))
        tag_w = min(im.width-x-pad, max(170, int(len(label)*10*min(sx, sy))))
        tag_y = max(0, y-pad-tag_h-6)
        draw.rounded_rectangle((x-pad, tag_y, x-pad+tag_w, tag_y+tag_h), radius=10, fill=(55, 111, 225))
        draw.text((x+2, tag_y+7), label, fill="white", font=font(max(16, int(18*min(sx, sy)))))
        im.save(target, quality=92)

def p(text, style):
    return Paragraph(text, style)

def build_pdf():
    try:
        pdfmetrics.registerFont(TTFont("Segoe", r"C:\Windows\Fonts\segoeui.ttf"))
        pdfmetrics.registerFont(TTFont("SegoeBold", r"C:\Windows\Fonts\segoeuib.ttf"))
        regular, bold = "Segoe", "SegoeBold"
    except Exception:
        regular, bold = "Helvetica", "Helvetica-Bold"
    styles = getSampleStyleSheet()
    title = ParagraphStyle("title", parent=styles["Title"], fontName=bold, fontSize=29, leading=33, textColor=colors.HexColor("#182233"), alignment=TA_CENTER, spaceAfter=18)
    subtitle = ParagraphStyle("subtitle", parent=styles["BodyText"], fontName=regular, fontSize=12, leading=17, textColor=colors.HexColor("#45536a"), alignment=TA_CENTER)
    h = ParagraphStyle("h", parent=styles["Heading1"], fontName=bold, fontSize=19, leading=23, textColor=colors.HexColor("#182233"), spaceAfter=8)
    body = ParagraphStyle("body", parent=styles["BodyText"], fontName=regular, fontSize=10.5, leading=15, textColor=colors.HexColor("#29364a"))
    small = ParagraphStyle("small", parent=body, fontSize=9, leading=12, textColor=colors.HexColor("#546176"))
    step = ParagraphStyle("step", parent=body, fontName=bold, fontSize=10, textColor=colors.HexColor("#2a64d6"), spaceAfter=6)
    doc = BaseDocTemplate(str(PDF_PATH), pagesize=letter, leftMargin=.65*inch, rightMargin=.65*inch, topMargin=.55*inch, bottomMargin=.52*inch)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="guide")
    doc.addPageTemplates([__import__('reportlab.platypus', fromlist=['PageTemplate']).PageTemplate(id="guide", frames=frame, onPage=page_number)])
    story = []
    story += [Spacer(1, .75*inch), p("GUÍA VISUAL", step), p("Comparte tu PC de GMM Server con otra cuenta", title), p("Tailscale · 15 pasos completos · PC en incógnito + iPhone", subtitle), Spacer(1, .3*inch)]
    story += [p("Qué lograrás", h), p("La otra cuenta tendrá acceso únicamente al PC que compartes, sin entrar a tu cuenta personal de Tailscale. Luego podrá conectarse desde su propio iPhone y usar GiveMyMovies de forma segura.", body), Spacer(1, .15*inch)]
    story += [p("Antes de comenzar", h), p("1. El PC debe estar encendido, con <b>GMM Server</b> iniciado.  2. El PC debe estar conectado a tu Tailscale.  3. En el panel de GMM Server, activa <b>HTTPS con Tailscale</b>.  4. La persona invitada necesita acceso a su correo y Tailscale instalado en su móvil.  5. En el PC de la persona invitada usa <b>Chrome en modo incógnito</b> durante la aceptación.", body), Spacer(1, .18*inch)]
    story += [p("Regla importante", h), p("Comparte la <b>máquina Windows</b>, no invites a la persona como miembro de tu tailnet. Así proteges tu red personal y ella solo verá el PC que autorizaste. La aceptación del correo se hace <b>dos veces</b>: una antes y otra después de iniciar sesión en Tailscale.", body), PageBreak()]
    for item in STEPS:
        story.append(p(f"PASO {item['number']} · {item['where']}", step))
        story.append(p(item["title"], h))
        story.append(p(item["action"], body))
        story.append(Spacer(1, .1*inch))
        im_path = ASSETS / item["asset"]
        im = Image.open(im_path)
        max_w, max_h = 6.95*inch, 4.65*inch
        scale = min(max_w/im.width, max_h/im.height)
        story.append(RLImage(str(im_path), width=im.width*scale, height=im.height*scale))
        story.append(Spacer(1, .1*inch))
        story.append(p(f"<b>Atención:</b> {item['note']}", small))
        story.append(PageBreak())
    story += [p("CONFIGURACIÓN FINAL · GiveMyMovies", step), p("Conecta la app al PC compartido", h), p("En GiveMyMovies abre <b>Ajustes</b> (el botón del engranaje). En el campo de GMM Server escribe la dirección HTTPS del PC compartido: <b>https://NOMBRE-DEL-PC.tu-tailnet.ts.net</b>. Pega la clave que copias del panel de GMM Server y pulsa <b>Probar conexión</b>.", body), Spacer(1, .14*inch), p("No uses IP privada ni agregues :7399 para el acceso remoto. La dirección debe empezar por <b>https://</b> porque la web de GiveMyMovies es segura y el navegador bloquea contenido mixto.", body), Spacer(1, .22*inch), p("Comprobación rápida", h), p("• El PC aparece verde en Tailscale del iPhone.  • En GiveMyMovies, Probar conexión responde correctamente.  • En la sección Te la tengo se muestra el catálogo.  • Si falla, revisa que GMM Server y Tailscale sigan encendidos y que no haya otra VPN activa.", body), Spacer(1, .45*inch), p("Datos sensibles cubiertos para que esta guía pueda compartirse de forma segura.", small)]
    doc.build(story)

def page_number(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d9e1ed"))
    canvas.line(doc.leftMargin, .34*inch, letter[0]-doc.rightMargin, .34*inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#60708a"))
    canvas.drawString(doc.leftMargin, .19*inch, "GiveMyMovies · Guía privada de Tailscale")
    canvas.drawRightString(letter[0]-doc.rightMargin, .19*inch, f"Página {doc.page}")
    canvas.restoreState()

if __name__ == "__main__":
    make_assets()
    build_pdf()
    print(PDF_PATH)
