# Sin Barreras Android · v1.5.2

Proyecto Android nativo listo para generar un Android App Bundle (`.aab`) de Google Play.

## Configuración incluida

- Application ID: `com.promptworks.sinbarreras`
- Version code: `1431`
- Version name: `1.5.2`
- Web app: `https://sin-barreras.onrender.com/`
- `compileSdk = 36`
- `targetSdk = 36`
- `minSdk = 26`
- Android Gradle Plugin `9.4.0`
- Gradle `9.6.1`
- Java 17
- Google Play Billing Library `9.1.0`
- Subscription product: `sin_barreras_monthly`
- Micrófono, cámara y selector de archivos integrados con WebView.
- Navegación externa fuera del dominio de Sin Barreras se abre fuera del WebView.
- HTTP sin cifrar bloqueado.

## Antes de generar el AAB

1. En Google Play Console crea la app con el package `com.promptworks.sinbarreras`. El package no debe cambiar después de publicar.
2. Crea una suscripción con Product ID exacto `sin_barreras_monthly` y un base plan mensual. Configura el precio deseado en Play Console.
3. Vincula una cuenta de servicio de Google Cloud con Google Play Console y dale los permisos necesarios para consultar y administrar suscripciones.
4. En Render configura las variables `GOOGLE_PLAY_*` descritas en el `.env.example` del proyecto raíz y vuelve a desplegar el backend.
5. Instala Android Studio con Android SDK 36 y JDK 17.
6. Abre la carpeta `android/` en Android Studio y deja que sincronice Gradle.
7. Prueba primero con Internal testing y una cuenta declarada como license tester.

## Crear la upload key

En Android Studio usa **Build > Generate Signed App Bundle or APK > Android App Bundle** y crea una upload key si todavía no tienes una.

Si quieres compilar por script, copia:

`keystore.properties.example` → `keystore.properties`

y completa la ruta y contraseñas de tu `.jks`. No subas ninguno de esos archivos a GitHub.

Después ejecuta en Windows:

```bat
build-aab.bat
```

El resultado queda en:

`app\build\outputs\bundle\release\app-release.aab`

## Billing

La compra se inicia con Play Billing desde Android. El cliente nunca decide si una compra es válida. El purchase token se envía al backend y se verifica con Google Play Developer API antes de otorgar acceso. Después de una verificación correcta, Android reconoce (`acknowledge`) la compra.

Las suscripciones web continúan usando Stripe. La app Android usa Google Play Billing para el plan digital.
