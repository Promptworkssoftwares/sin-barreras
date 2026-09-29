# Sin Barreras v1.7.9

## 1.7.9 · Frases y palabras guardadas compactas
- Tarjetas de Frases Guardadas y Palabras guardadas más pequeñas, con contenido destacado y mejor jerarquía visual.
- Escuchar, Practicar, Copiar, Compartir y Eliminar se mantienen en una sola línea; las acciones de icono conservan nombres accesibles.
- Waveform dual de v1.7.8 integrado en una línea compacta dentro de cada tarjeta, con respuesta real del micrófono donde ya se usaba.
- Al iniciar una nueva reproducción, se completa la reproducción anterior para que sus indicadores vuelvan al estado de reposo.
- Android actualizado a versionCode 1709 / versionName 1.7.9.

## 1.7.8 · Waveform futurista de voz AI + voz del usuario
- Añadido un sistema visual de audio unificado para **Aprender** con dos identidades claras: **VOZ AI** y **TU VOZ**.
- La voz del usuario usa el nivel real del micrófono para mover el waveform durante pronunciación y respuestas por voz.
- La voz AI muestra un waveform futurista durante TTS en palabras, lecciones, Frases rápidas, Frases Guardadas, práctica por partes y Sound Lab.
- Sound Lab diferencia visualmente **VOZ MODELO** de **TU VOZ** al comparar pronunciación.
- Diseño compacto mobile-first con orb, waveform, glow y estados Reproduciendo / Escuchando / Analizando.
- El nuevo módulo se incluye en el Service Worker para la experiencia PWA instalada.
- Eliminado el auto-zoom al seleccionar campos/opciones en móvil manteniendo el zoom manual de accesibilidad.
- Eliminados los efectos `scale/translate` al tocar controles y tarjetas en pantallas táctiles.
- Android actualizado a versionCode 1708 / versionName 1.7.8.

## 1.7.6 · Aprender + Práctica unificados
- Eliminado el tab independiente **Práctica** del menú inferior.
- El menú principal queda en **Hablar · Aprender · Coach · Cámara**.
- Aprender concentra rutas, sonidos/pronunciación, Frases rápidas, Frases Guardadas, aprendizaje desde conversaciones y Palabras guardadas.
- Los accesos antiguos a `practice` redirigen de forma segura a Aprender.
- Las frases provenientes del historial abren directamente **Aprender → Frases rápidas** para entrenarlas sin una pantalla duplicada.
- Coach sigue siendo el único espacio de conversaciones completas y role-play.
- Android actualizado a versionCode 1706 / versionName 1.7.6.


## 1.7.5 · Frases rápidas y Frases Guardadas dentro de Aprender
- **Frases rápidas** se movió de Práctica a **Aprender**, donde ahora funciona como una ruta para crear y aprender una frase nueva en cualquier idioma compatible.
- Añadida la opción **Frases Guardadas** dentro de Aprender para abrir la biblioteca personal, escuchar frases y practicar por partes.
- La biblioteca antes titulada “Mis frases” ahora se presenta como **Frases Guardadas** y tiene regreso directo a Aprender.
- **Práctica** deja de crear frases nuevas y pasa a ser un centro de entrenamiento para Sonidos, Palabras guardadas, Frases Guardadas y acceso a Coach.
- **Coach** continúa siendo el único lugar visible para conversaciones completas y role-play de situaciones reales.
- La navegación marca Frases Guardadas como contenido de Aprender y mantiene acceso directo desde Hablar/Settings.
- Diseño mobile-first para las nuevas tarjetas y accesos, sin duplicar la lógica de pronunciación ni la biblioteca offline.
- Android actualizado a versionCode 1705 / versionName 1.7.5.


## v1.7.3 · Premium practice UI polish
- Rediseño visual de tabs, toggles y filtros con relieve sutil y estados activos más modernos.
- Tarjetas de palabras, frases y práctica con más profundidad, brillo superior y sombras suaves.
- Contenedores de práctica ahora reaccionan al audio con glow visual al escuchar/procesar.
- UI móvil conservada compacta para teléfono, sin hacerla exagerada ni pesada.
# Sin Barreras v1.7.3

## 1.7.3
- Resultados de traducción y pronunciación rediseñados para móvil: tipografía modesta, tarjetas compactas y menor altura vertical en Práctica, Coach, Frases y Sonidos.
- Medidores y señal de audio se mantienen visibles sin dominar la pantalla.
- Sin cambios en lógica de IA, puntuación, Billing, autenticación o backend.

- Coach ahora es realmente multilenguaje: el usuario elige **Mi idioma** y **Idioma que quiero practicar** usando el catálogo completo de Sin Barreras.
- Todas las líneas del role-play, correcciones, sugerencias, TTS y frases útiles del Coach usan el idioma objetivo; las explicaciones permanecen en el idioma del usuario.
- Coach Principiante conserva el modo pre-A1/A1 en cualquier idioma, con frases muy cortas, significado visible y respuestas sugeridas.
- Práctica y Coach usan resultados más compactos y mobile-first, con tipografía reducida, medidores circulares y menos texto vertical.
- Añadida visualización de entrada de audio con barras reactivas al volumen real del micrófono durante escucha; cambia a estados Pausa y Analizando durante el procesamiento.
- Frases por partes comparte el mismo feedback visual compacto y la señal de audio reactiva.
- Práctica ahora ofrece dos modos: Frase rápida y Conversación guiada multilenguaje.
- Nuevos escenarios esenciales para personas nuevas en el país: parada de tráfico, fast food, farmacia, doctor, trabajo, vivienda, banco, escuela, compras, transporte, DMV y emergencia.
- Conversación guiada de Práctica usa sesiones cortas de 5–8 turnos, respuestas sugeridas, audio normal/lento, progreso de misión y feedback amigable en el idioma del usuario.
- Coach amplía sus escenarios con situaciones específicas y accesos rápidos para tráfico, comida rápida, farmacia, trabajo, vivienda y DMV.
- Escenarios sensibles (tráfico, DMV, salud, farmacia, banco, vivienda y emergencia) se mantienen como práctica de comunicación, sin asesoría legal, médica o financiera.
- Android actualizado a versionCode 1700 / versionName 1.7.3.

# Sin Barreras v1.6.8

- Hablar más compacto: lema en una sola línea, selector de idiomas y contexto reducidos, y Cara a cara / Mis frases / Conectar por QR en una sola fila horizontal.
- Aprender rediseñado con launcher 2×2 más compacto y profesional.
- Nuevos medidores circulares de pronunciación en Práctica, Frases por partes y Sonidos.
- Coach incorpora medidor gráfico de claridad en el micro-feedback.
- Sound Lab usa feedback amigable en el idioma del usuario en vez de mostrar texto crudo no latino como explicación principal.
- Se conserva toda la lógica existente de voz, IA, Billing, caché, QR, autenticación y backend.

# Changelog

## 1.6.8 · Preferencias modernas + barra visible de minutos

- Rediseño completo del menú de Preferencias con tarjetas modernas, jerarquía visual y mejor comportamiento móvil.
- Barra de uso visible dentro de Preferencias con minutos usados, límite del período, porcentaje, minutos restantes y fecha de renovación.
- La barra refleja específicamente el consumo de minutos de voz; el límite general de IA sigue protegido en backend.
- Estados visuales normal, advertencia y límite alcanzado, sincronizados con el endpoint real de la cuenta.
- Preferencias conserva todas las funciones existentes: idioma automático, voz, prueba de voz, tamaño de texto, tema, Mis frases e Historial.
- Android actualizado a versionCode 1606 / versionName 1.6.8.

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
