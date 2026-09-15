# Google Play release checklist · Sin Barreras v1.5.2

## 1. Play Console

- Crear la app en Play Console.
- Package/application ID: `com.promptworks.sinbarreras`.
- Crear la suscripción `sin_barreras_monthly`.
- Activar un base plan mensual y configurar su precio.
- Configurar Internal testing antes de Production.
- Añadir cuentas de prueba / license testers.
- Completar Store listing, App content, Data safety, Content rating y Target audience.
- Añadir una Privacy Policy pública que describa voz/audio, cámara/imágenes, cuenta, datos de uso, pagos y proveedores externos.

## 2. Google Play Developer API

Configurar una service account vinculada a Play Console y añadir en Render:

```env
GOOGLE_PLAY_PACKAGE_NAME=com.promptworks.sinbarreras
GOOGLE_PLAY_PRODUCT_ID=sin_barreras_monthly
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY=...
```

La private key debe vivir únicamente en los secretos del hosting. No se incluye dentro del APK/AAB ni se envía al navegador.

## 3. Backend production

En Render verifica además:

```env
APP_URL=https://sin-barreras.onrender.com
ALLOWED_ORIGINS=https://sin-barreras.onrender.com
NODE_ENV=production
```

Configura también MongoDB, Session Secret, OpenAI y Stripe para la versión web.

## 4. Android Studio

- JDK 17.
- Android SDK Platform 36.
- Android SDK Build-Tools 36.x.
- Abrir `android/`.
- Gradle Sync.
- Probar login local, micrófono, cámara, audio TTS, navegación, compra, restauración y manage subscription.

## 5. Firma y AAB

Usa Play App Signing y conserva tu upload key de forma segura.

Genera el AAB desde Android Studio con:

**Build → Generate Signed App Bundle or APK → Android App Bundle**

O configura `android/keystore.properties` y ejecuta `android/build-aab.bat`.

## 6. Pruebas mínimas antes de Production

- Instalación desde Internal testing, no solo sideload.
- Compra de suscripción con license tester.
- Compra cancelada por usuario.
- Restauración después de reinstalar.
- Suscripción cancelada pero todavía dentro del período pagado.
- Expiración del período.
- Login/logout y otra cuenta en el mismo dispositivo.
- Revocación desde Owner Dashboard.
- Micrófono denegado y luego permitido.
- Cámara denegada y luego permitida.
- Modo oscuro/claro y dispositivos estrechos.
