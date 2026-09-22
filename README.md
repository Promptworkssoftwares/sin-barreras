# Sin Barreras v1.6.6

### Nuevo en 1.6.6

- Límite backend de **150 minutos de voz por usuario y período**.
- Protección interna de costo para Coach, Cámara, TTS, traducción y otras funciones de IA.
- Aviso automático al 80 % y bloqueo seguro al llegar al límite.
- Mi Cuenta muestra consumo, porcentaje utilizado, minutos restantes y fecha de reinicio.
- Admin Dashboard muestra consumo por usuario, costo estimado, alertas y límites alcanzados.
- El intérprete manos libres se detiene al alcanzar el límite para evitar ciclos de reintentos.
- Las conversaciones QR consumen el límite de la cuenta host.

La versión conserva las mejoras de 1.6.4: feedback de pronunciación amigable y multilenguaje, cache privado de IA y cache local de TTS.

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
