# Changelog

## 1.4.43 · Browser audio unlock fix
- Corregido el bloqueo de autoplay de Safari/Chrome para la voz generada por IA.
- Nuevo `audio-playback.js` con AudioContext persistente y desbloqueo desde el primer gesto del usuario.
- Añadido fallback HTMLAudio ya primado por gesto del usuario.
- La reproducción TTS ya no crea un `new Audio(data:...)` diferente por cada respuesta.
- Web y Android sincronizados a `1.4.43` (`versionCode 1443`).

## 1.4.42 · Floating Hablar card refinement
- Contenedor Hablar más compacto, moderadamente oscuro y flotante.
