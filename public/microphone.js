const DEFAULT_AUDIO_CONSTRAINTS = Object.freeze({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isAudioStartFailure(error) {
  const name = String(error?.name || '');
  const message = String(error?.message || '');
  return name === 'NotReadableError'
    || name === 'AbortError'
    || /could not start audio source/i.test(message)
    || /track start/i.test(message);
}

export function microphoneErrorMessage(error) {
  const name = String(error?.name || '');
  const message = String(error?.message || '');

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Permite el micrófono para Sin Barreras en Ajustes de Android e inténtalo nuevamente.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Android no encontró un micrófono disponible en este dispositivo.';
  }
  if (isAudioStartFailure(error)) {
    return 'Android no pudo iniciar el micrófono. Cierra otra app que esté grabando audio, verifica el permiso de micrófono y vuelve a intentarlo.';
  }
  return message || 'No fue posible iniciar el micrófono.';
}

export async function getMicrophoneStream({ constraints = DEFAULT_AUDIO_CONSTRAINTS, retrySimple = true } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Este navegador no permite grabar audio. Usa Chrome, Safari o Edge actualizado.');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: constraints, video: false });
  } catch (firstError) {
    if (!retrySimple || !isAudioStartFailure(firstError)) throw firstError;

    // Android System WebView can occasionally fail to initialize the audio track
    // with advanced WebRTC constraints. Give the native audio stack a moment and
    // retry once with the device default input before surfacing the error.
    await sleep(350);
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (secondError) {
      if (!secondError.message && firstError?.message) secondError.message = firstError.message;
      throw secondError;
    }
  }
}

export { DEFAULT_AUDIO_CONSTRAINTS };
