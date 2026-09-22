# Changelog

## 1.6.6 · Preferencias modernas + barra visible de minutos

- Rediseño completo del menú de Preferencias con tarjetas modernas, jerarquía visual y mejor comportamiento móvil.
- Barra de uso visible dentro de Preferencias con minutos usados, límite del período, porcentaje, minutos restantes y fecha de renovación.
- La barra refleja específicamente el consumo de minutos de voz; el límite general de IA sigue protegido en backend.
- Estados visuales normal, advertencia y límite alcanzado, sincronizados con el endpoint real de la cuenta.
- Preferencias conserva todas las funciones existentes: idioma automático, voz, prueba de voz, tamaño de texto, tema, Mis frases e Historial.
- Android actualizado a versionCode 1606 / versionName 1.6.6.

## 1.6.5 · Límites mensuales de uso de IA

- Añadido límite backend configurable de 150 minutos de voz por usuario y período.
- Añadido tope interno configurable de costo estimado para proteger el margen ante uso intensivo de Coach, Cámara, TTS y texto.
- Mi Cuenta ahora muestra minutos usados, porcentaje del plan, fecha de reinicio y alertas.
- El intérprete manos libres se detiene al alcanzar el límite para evitar reintentos automáticos.
- Las conversaciones QR respetan el límite del suscriptor host.
- Admin Dashboard muestra límite global, presupuesto interno, usuarios en alerta/bloqueados y consumo por usuario.
- El límite se anuncia en la pantalla de precios y en los Términos de Uso.
- Android actualizado a versionCode 1605 / versionName 1.6.5.

## 1.6.4 · Feedback de pronunciación multilenguaje fácil de entender
- La evaluación de voz ya no usa transcripciones en alfabetos no latinos como explicación principal del error.
- Añadidos `heardMeaning`, `heardPronunciation` y `difference` para explicar en el idioma de apoyo qué entendió la app, cómo sonó y qué cambiar.
- Mandarín, ruso, árabe, japonés y otros alfabetos conservan la escritura original solo como frase modelo; el feedback usa pronunciación legible sin IPA.
- Práctica, Coach al repetir frases y Mis frases por partes comparten la misma capa de feedback amigable.
- El cache de evaluaciones se versionó para no reutilizar resultados antiguos que carecen del nuevo feedback.
- Android actualizado a versionCode 1604 / versionName 1.6.4.


## 1.6.3 · Android microphone / WebView audio fix
- Added `android.permission.MODIFY_AUDIO_SETTINGS` so Chromium WebView can enumerate/route Android recording devices together with `RECORD_AUDIO`.
- Added a conservative one-time microphone fallback: advanced audio constraints first, then the default Android input if WebView returns `NotReadableError` / `Could not start audio source`.
- Improved microphone error messages without changing translation, authentication, billing, camera, backend, or study logic.
- Android bumped to versionCode 1603 / versionName 1.6.3.

## 1.6.2 · AI cache + study reuse

- Added private per-account MongoDB cache for repeated translations, Practice generation, saved-phrase lessons, pronunciation evaluations and short TTS audio.
- Added persistent device TTS Cache Storage so repeated Listen/Slow study playback avoids network/OpenAI calls after first generation.
- Practice scoring now skips chat evaluation only for >=96% deterministic transcript matches; natural alternative wording still uses the AI evaluator.
- Fixed Service Worker activation so app updates no longer wipe saved phrase/TTS audio caches.
- Added cache-hit tracking in Owner Dashboard and account-deletion cleanup.
- Cache retention is configurable and disclosed in Privacy/Data Safety documentation.
- Android bumped to versionCode 1602 / versionName 1.6.2.

## 1.6.1 · Google Play 7-day free trial + AAB final prep

- Android now selects the eligible 7-day Google Play free-trial offer instead of blindly using the first offer returned.
- Ineligible users automatically fall back to the normal monthly base plan.
- Google Play purchase verification detects `offerPhase.freeTrial` and stores `subscriptionStatus=trialing`.
- Landing/account UI clearly explains trial, renewal, monthly price and cancellation.
- Admin separates active trials from paid subscriptions and excludes free trials from realized MRR.
- Added exact Play Console subscription/offer setup guide.
- Added upload-key helper and AAB readiness checker.
- Android bumped to versionCode 1601 / versionName 1.6.1.

## 1.6.0
- Google Play compliance pass: public Privacy/Terms pages, explicit adult/terms consent on local registration, Data Safety and submission docs.
- Added AI content reporting with Owner review queue.
- Added QR conversation terms acceptance, participant/message reporting and blocking.
- Hardened Android manifest for large screens and removed an unnecessary audio-settings permission.
- Added Google Play reviewer account seeding and release documentation.
- Versioned all web/PWA/Android assets to 1.6.0.

## 1.6.0 · Frases multilenguaje por partes

- `Mis frases` ahora practica el idioma real guardado; ya no fuerza inglés.
- Nueva lección guiada que divide cada frase en 1–6 segmentos cortos y termina practicando la frase completa.
- Cada segmento incluye significado, pronunciación legible, consejo, audio normal/lento y evaluación de voz.
- La división conserva exactamente el texto de la traducción guardada y valida que no se omitan ni cambien palabras.
- El progreso por frase guarda cantidad de prácticas, mejor puntuación y última práctica, sincronizado con la cuenta.
- Las lecciones preparadas se cachean localmente para abrir más rápido al repetirlas.
- Android actualizado a `1.6.0` (`versionCode 1504`).

## 1.5.3 · Cloudflare Remote QR Portal

- Conversaciones QR locales ahora crean automáticamente un portal HTTPS público mediante el binario oficial `cloudflared`.
- El segundo teléfono puede conectarse desde datos móviles, otra Wi‑Fi o cualquier red con Internet; ya no necesita compartir la red local del host.
- `install.bat` instala/verifica `cloudflared`; también disponible con `npm run cloudflare:install`.
- El QR usa automáticamente la URL `https://*.trycloudflare.com` cuando Sin Barreras corre en `localhost`.
- Nuevo `QR_PUBLIC_URL` para usar Render, dominio propio o un Cloudflare Named Tunnel estable sin abrir un Quick Tunnel.
- El transporte QR cambió de SSE a sincronización HTTP ligera cada ~1.2 s porque Cloudflare Quick Tunnels no soportan Server-Sent Events.
- CORS actualizado para aceptar correctamente solicitudes same-origin a través del hostname público del túnel sin abrir los APIs autenticados a orígenes arbitrarios.
- El token de invitación viaja en el fragmento `#token=` del QR (no en la petición inicial) y los syncs usan un header dedicado para reducir exposición en URLs/logs.
- El binario `cloudflared` queda excluido del ZIP de release; se instala localmente al ejecutar el instalador.
- Android actualizado a `1.5.3` (`versionCode 1503`).

## 1.5.2 · Mis palabras accesibles

- El botón de la traducción ahora dice **Guardar en Mis palabras** para dejar claro el destino.
- Después de guardar, la app abre directamente **Aprender → Mis palabras** en vez de dejar al usuario en el inicio.
- Nuevo acceso principal **Mis palabras** dentro de Aprender con contador visible.
- Nueva vista dedicada con lista de vocabulario, escuchar, practicar, eliminar y **Practicar mis palabras**.
- Las palabras extraídas conservan la situación de la conversación para dar más contexto.
- Android actualizado a `1.5.2` (`versionCode 1502`).

## 1.5.1 · Multilanguage Practice + Absolute Beginner Coach

- Práctica ahora permite elegir idioma nativo e idioma objetivo usando el catálogo completo de idiomas.
- Generación, TTS, transcripción y evaluación de Práctica respetan el idioma objetivo seleccionado.
- Comparación de texto de Práctica mejorada para escrituras no latinas mediante normalización Unicode.
- Coach Principiante convertido a pre-A1/A1: frases de 2–7 palabras, vocabulario básico y una idea por turno.
- En Principiante la traducción del Coach se muestra automáticamente, el audio se reproduce más lento y se ofrecen respuestas pequeñas para copiar.
- Evaluación de Principiante acepta respuestas de una palabra o frases muy cortas cuando comunican correctamente.
- Android actualizado a `1.5.1` (`versionCode 1501`).

## 1.5.0 · Real Conversation Toolkit

- Nuevo modo **Cara a cara** con pantalla dividida para dos personas y traducción manos libres.
- Nuevo **Aprender de mis conversaciones**: convierte frases reales del historial en práctica personalizada.
- Nuevo **Mis frases** con categorías, búsqueda, audio local y acceso offline mediante Cache Storage.
- Nuevo fallback `/offline-phrases.html` cuando `/app` se abre sin conexión.
- Nueva **Conversación por QR** entre dos teléfonos: el invitado no necesita cuenta ni instalar la app.
- Salas QR temporales con tokens hasheados, expiración automática y eventos en tiempo real.
- Audio de frases guardadas se mantiene fuera del estado cloud para evitar payloads grandes.
- Android sincronizado a `1.5.0` (`versionCode 1500`).

## 1.4.46 · Faster Voice Turn Detection

- Acorta la pausa final para que las conversaciones respondan más rápido sin eliminar la tolerancia a pausas naturales.
- Habla corta: `1.80 s` (antes `2.15 s`).
- Habla normal: `1.45 s` (antes `1.75 s`).
- Habla larga: `1.20 s` (antes `1.45 s`).
- Indicador de pausa/pensando: `0.42 s` (antes `0.48 s`).
- Sincroniza los mismos valores entre el intérprete principal y el motor compartido de turnos de voz.
- Web y Android sincronizados a `1.4.46` (`versionCode 1446`).

## 1.4.45 · Account Security & Release Hardening
- Verificación obligatoria de email para nuevas cuentas locales y reenvío de verificación.
- Recuperación de contraseña con tokens SHA-256 de un solo uso y expiración.
- Eliminación de cuenta desde la app y desde `/account-deletion`, incluso sin entitlement activo.
- Tracking diario por usuario del uso/costo estimado de OpenAI y nuevo panel Admin **Uso IA**.
- MRR separado por Stripe/Google Play y margen bruto estimado después del costo de IA.
- Content Security Policy activada y Service Worker endurecido para no cachear páginas sensibles.
- Packaging de release seguro con exclusión de `.env`, `node_modules`, `.git`, keystores y credenciales.
- Web y Android sincronizados a `1.4.45` (`versionCode 1445`).

## 1.4.44 · Floating AI Voice Activity
- Separado el procesamiento de IA del botón de práctica de voz.
- Nuevo indicador flotante persistente para escuchar, esperar, analizar y preparar el score.
- El mismo flujo funciona en la primera práctica y en **Grabar otra vez**.
- Web y Android sincronizados a `1.4.44` (`versionCode 1444`).

## 1.4.43 · Browser Audio Unlock Fix
- Audio TTS desbloqueado desde el gesto del usuario con motor persistente y fallback compatible con políticas de autoplay.
