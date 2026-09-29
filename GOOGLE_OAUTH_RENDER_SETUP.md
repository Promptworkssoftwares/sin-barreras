# Google OAuth · Sin Barreras · Render

Producción oficial:

- App URL: `https://sin-barreras.onrender.com`
- Authorized redirect URI: `https://sin-barreras.onrender.com/auth/google/callback`

## Google Cloud Console

En **APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs**, añade exactamente:

```text
https://sin-barreras.onrender.com/auth/google/callback
```

Para desarrollo local puedes conservar también:

```text
http://localhost:3000/auth/google/callback
```

La coincidencia debe ser exacta: protocolo, dominio, puerto y ruta.

## Render

La aplicación queda preparada para:

```env
APP_URL=https://sin-barreras.onrender.com
GOOGLE_CALLBACK_URL=https://sin-barreras.onrender.com/auth/google/callback
ALLOWED_ORIGINS=https://sin-barreras.onrender.com
```

`GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` permanecen como secretos de Render y nunca se incluyen en el release.
