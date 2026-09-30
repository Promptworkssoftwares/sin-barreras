# Sin Barreras v1.7.21

### Nuevo en 1.7.21

- La lección por imágenes conserva traducciones y audio aunque la IA entregue una lectura latina defectuosa. El servidor repara automáticamente las lecturas que faltan sin rehacer las traducciones válidas.
- Si la reparación temporalmente no está disponible, se presenta el significado en el idioma del usuario y el reto visual sigue funcionando; la escritura original continúa opcional.

### Nuevo en 1.7.20

- Reproducción móvil de la voz IA mediante el elemento de audio nativo, con onda medida desde el audio real sin redirigir la salida a Web Audio.
- Si el navegador bloquea el audio automático de una traducción, la conversación se pausa y el usuario puede pulsar Repetir para escucharla.

### Nuevo en 1.7.19

- Aprender por imágenes muestra el significado en el idioma del usuario y la lectura con letras latinas para mandarín, ruso y otros idiomas con escritura no latina.
- La escritura original se puede consultar bajo demanda. Audio y práctica de voz conservan el texto original del idioma elegido.

### Nuevo en 1.7.18

- Aprender por imágenes organiza temas y niveles por separado: Pronombres, Familia y Situaciones tienen su propio Nivel 1. Los niveles futuros aparecen como pendientes hasta incorporar sus imágenes.
- Familia Nivel 1: 19 fotografías optimizadas en cuatro categorías (familia cercana, trato cotidiano, parientes y pareja), con traducción, audio disponible según idioma y reto visual.

### Nuevo en 1.7.17

- Nivel 1 de Aprender por imágenes: Pronombres con 34 imágenes reales suministradas, seis categorías principales y demostrativos como categoría adicional.
- Nivel 2 conserva las ocho imágenes de situaciones. Cada categoría traduce palabras y frases según la función gramatical, con audio, práctica de voz y reto visual donde hay soporte de voz.
- Imágenes optimizadas para móvil, aproximadamente 1.7 MB en total.


### Nuevo en 1.7.16

- Aprender por imágenes: ocho conceptos visuales, selección de dos idiomas del catálogo y audio/práctica de frases donde el proveedor admite voz.
- Reto de identificación de imágenes con XP y progreso sincronizado en la cuenta.


### Nuevo en 1.7.15

- Aprender de mis conversaciones → Practicar abre una conversación continua con IA basada en el intercambio del historial, en vez de abrir «¿Qué quieres decir?».
- La escena y los turnos siguientes mantienen el contexto original.


### Nuevo en 1.7.14

- Se ven las barras de VOZ AI en Frases guardadas y palabras guardadas.
- Escuchar indica cuándo prepara la voz y evita la interrupción del reproductor al tocar la pantalla.

### Nuevo en 1.7.13

- En Frases guardadas → Escuchar, la onda de VOZ AI responde a la señal real de audio.
- Mejor visibilidad de las barras en frases, palabras y práctica por partes.
- Hablar conserva su única onda original.

### Nuevo en 1.7.12

- Onda real de la voz IA en la traducción, la pantalla principal y las tarjetas de aprendizaje.
- El medidor usa muestras del audio reproducido y vuelve a reposo cuando termina.

### Nuevo en 1.7.11

- El enlace de Admin solo se muestra en la sesión owner, tanto en Mi cuenta como en la portada.
- Corregido el estilo de los botones ocultos de Mi cuenta.

### Nuevo en 1.7.10

- Onda de voz IA que responde al audio durante la reproducción.
- Pantallas de practicar palabras y frases más legibles y organizadas, conservando los controles existentes.

### Nuevo en 1.7.9

- Frases y palabras guardadas con tarjetas compactas, texto resaltado y acciones horizontales.
- Se conserva la onda dual permanente y reactiva de la versión 1.7.8.

### Nuevo en 1.7.8

- **Waveform futurista dual:** VOZ AI y TU VOZ tienen una identidad visual distinta dentro de Aprender.
- **Tu voz reacciona al micrófono real:** las barras cambian con el nivel capturado mientras practicas pronunciación.
- **La voz AI también cobra vida:** palabras, Frases rápidas, Frases Guardadas, lecciones, práctica por partes y sonidos muestran un waveform durante el audio.
- **Comparación A/B moderna:** Sound Lab muestra claramente el modelo AI y tu propia grabación.
- UI compacta para teléfono; no se reemplazó la lógica de IA, Billing, autenticación, QR ni cache.
- **Sin auto-zoom en móvil:** selects, inputs y opciones ya no agrandan la pantalla al tocarlos; los gestos manuales de accesibilidad siguen disponibles.

Aplicación SaaS/PWA/Android para interpretación de voz, práctica multilenguaje, AI Coach, cámara, frases offline, modo cara a cara y conversaciones QR entre dos teléfonos.

## Inicio rápido en Windows

1. Ejecuta `install.bat`.
   - Instala las dependencias npm.
   - Genera/valida `SESSION_SECRET`.
   - Descarga el binario oficial `cloudflared` en `bin/cloudflared.exe`.
2. Configura `.env` con MongoDB, OpenAI, Owner y los proveedores que uses.
3. Ejecuta `start.bat`.
4. Abre `http://localhost:3000`.

## QR entre teléfonos en redes diferentes

Cuando Sin Barreras corre en `localhost` y creas una conversación QR:

1. El servidor detecta que la URL local no es accesible desde Internet.
2. Inicia `cloudflared` automáticamente.
3. Cloudflare entrega una URL temporal HTTPS `https://*.trycloudflare.com`.
4. Esa URL se coloca dentro del QR de invitación.
5. El segundo teléfono puede abrirla desde otra Wi‑Fi o desde datos móviles.

No hace falta abrir puertos del router ni compartir la misma red.

### Comandos útiles

```bash
npm run cloudflare:install
npm run cloudflare:check
npm start
npm test
npm run package:release
```

`QR_PUBLIC_URL` permite sustituir el Quick Tunnel por una URL HTTPS estable de Render, un dominio propio o un Cloudflare Named Tunnel.

> Los Quick Tunnels de Cloudflare están pensados para desarrollo/pruebas. En producción, la aplicación desplegada en Render o un Named Tunnel estable debe usar su URL pública normal.


## Límite de uso de IA por usuario

Sin Barreras aplica el límite en el backend, no en el navegador. El valor inicial recomendado de esta versión es **150 minutos de voz por período** por usuario. Además existe un tope interno de costo estimado para proteger Coach, Cámara, TTS y otras llamadas que no dependen directamente de minutos de transcripción.

Variables principales:

```env
AI_USER_MONTHLY_MINUTES_LIMIT=150
AI_USER_MONTHLY_BUDGET_USD=3.00
AI_USER_WARNING_PERCENT=80
AI_TRIAL_PERIOD_DAYS=7
```

- El usuario ve su consumo desde **Mi Cuenta** y recibe aviso al 80 %.
- Al alcanzar el límite, el backend devuelve `AI_MONTHLY_LIMIT_REACHED` y bloquea nuevas llamadas de IA hasta el siguiente período.
- El intérprete manos libres se detiene automáticamente para evitar reintentos continuos.
- Las conversaciones QR consumen el límite del host que creó la sala.
- La cuenta owner queda fuera del límite.
- El Admin Dashboard muestra consumo, costo estimado, usuarios en alerta y usuarios bloqueados.
- El tope de costo usa las variables `AI_COST_*`; si cambias de modelo o cambian tus tarifas reales, actualízalas en Render para mantener la protección económica alineada.

## Seguridad del portal QR

- Invitaciones separadas para host e invitado.
- Tokens aleatorios guardados como SHA-256.
- Salas con expiración automática.
- La persona invitada no obtiene acceso a la cuenta ni al dashboard.
- El consumo de IA continúa ligado a la suscripción del host.
- El ZIP de release no incluye `.env`, `node_modules`, `.git`, keystores ni el binario `cloudflared`.

## Google Play · oferta de 7 días gratis

La app Android está preparada para `sin_barreras_monthly` con un plan base mensual y una oferta de prueba gratis. Google Play decide la elegibilidad; la app nunca concede la prueba por su cuenta.

Configura en Play Console:

- Subscription product ID: `sin_barreras_monthly`
- Base plan ID recomendado: `monthly`
- Tipo: auto-renewing
- Periodo: 1 mes
- Precio EE. UU.: USD 5.99
- Offer ID recomendado: `trial-7-days`
- Eligibility: New customer acquisition → nunca tuvo una suscripción de esta app
- Pricing phase: Free trial → 7 days
- Offer tag recomendado: `sb-7-day-trial`
- Regiones: las mismas donde esté disponible el base plan

Android consulta en tiempo real las ofertas elegibles que devuelve Google Play. Si existe una prueba gratis de 7 días para esa cuenta, la prioriza; si Google determina que el usuario no es elegible, se muestra y compra el plan mensual normal.

Durante la prueba el backend confirma `lineItems.offerPhase.freeTrial` con `purchases.subscriptionsv2.get` y guarda el estado como `trialing`. El acceso termina o continúa según el estado y `expiryTime` devueltos por Google.
