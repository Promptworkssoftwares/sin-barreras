# Security · Sin Barreras

## Secrets
All production secrets must be provided only through server-side environment variables / hosting secret settings. Never place them in `public/`, `private/`, HTML, browser JavaScript, Android resources, or source control.

Sensitive variables include:
- `MONGODB_URI`
- `SESSION_SECRET`
- `OWNER_PASSWORD`
- `GOOGLE_CLIENT_SECRET`
- `CHATGPT_OAUTH_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

`GOOGLE_CLIENT_ID`, callback URLs, app URLs, price, currency, and MongoDB database name are configuration values, not passwords; they still belong in environment configuration when deployment-specific.

## Before release
Run:

```bash
npm run security:audit
npm test
```

The `.env` file, signing keys, private keys, keystores and service-account credentials are ignored by `.gitignore` and must never be uploaded to GitHub or bundled into a mobile client.

## Google Play / mobile packaging
Only the client/web shell should be packaged or wrapped for Google Play. OpenAI, Stripe secret keys, MongoDB credentials, Google OAuth client secret and owner credentials must remain on the hosted backend (for example Render) and never inside an APK/AAB.
