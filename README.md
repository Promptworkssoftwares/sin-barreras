# Sin Barreras v1.6.1

### Nuevo en 1.6.1

`Mis frases` incluye práctica multilenguaje por segmentos: escucha, repite y recibe evaluación parte por parte antes de decir la frase completa. El progreso de cada frase se sincroniza con la cuenta.

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
