# Play Console submission — Sin Barreras v1.6.5

## Before uploading the AAB
1. Deploy the exact backend/web version bundled with this source.
2. Configure production `.env` secrets in hosting. Never upload `.env` to Play Console or source control.
3. Create the subscription product `sin_barreras_monthly` in Play Console and ensure Billing is active.
4. Configure the Google Play Developer API service account variables on the backend.
5. Configure the production signing keystore locally in `android/keystore.properties` (never commit it).
6. Run `npm test` and `npm run security:audit`.
7. Build the signed AAB with `android/build-aab.bat` or Gradle.
8. Create a reviewer account with `npm run seed:reviewer`; enter those credentials in App access in Play Console.

## Play Console forms
- App access: explain that login/subscription normally protects the app and provide reviewer credentials.
- Ads: declare no ads if production still contains no third-party advertising.
- Content rating: complete accurately for translation/AI/UGC functionality.
- Data safety: use `GOOGLE_PLAY_DATA_SAFETY.md` as the implementation reference, then answer the live form based on actual production data flow.
- Privacy policy URL: public HTTPS `/privacy` page.
- Account deletion URL: public HTTPS `/account-deletion` page.
- Target audience: adults / 18+ unless product design changes.
- UGC: QR conversations include terms acceptance, report and block controls.
- AI-generated content: users can report unsafe/offensive/incorrect AI output inside the app.

## Internal testing smoke test
- Register -> verify email -> login.
- Google Play subscription purchase and restore.
- Microphone permission, hands-free translation and TTS.
- Camera permission and image analysis.
- Practice multilingual flow and beginner Coach.
- Phrasebook offline fallback.
- QR conversation between two devices on different networks.
- QR report/block flow.
- AI report flow and owner review screens.
- Account deletion from app and from `/account-deletion`.

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
