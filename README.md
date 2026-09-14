# Sin Barreras v1.4.43 · Browser Audio Unlock Fix

## Qué cambia
- El audio TTS de la IA se desbloquea desde el primer gesto real del usuario.
- Nuevo motor persistente de reproducción con Web Audio API para evitar el bloqueo de autoplay después de llamadas asíncronas.
- Fallback con un único elemento HTMLAudio preparado por el mismo gesto del usuario para Safari/Chrome.
- El AudioContext de reproducción queda separado del AudioContext usado por el micrófono.
- El modo manos libres puede seguir reproduciendo respuestas sucesivas sin pedir un toque por cada traducción.

## Cómo probar
1. Copia tu `.env` actual.
2. Ejecuta `start.bat`.
3. Selecciona el idioma de la otra persona.
4. Toca `Comenzar a hablar` una sola vez y prueba varias rondas consecutivas.
