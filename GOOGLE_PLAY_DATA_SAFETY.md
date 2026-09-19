# Google Play Data Safety — Sin Barreras v1.6.1

Use this file as the implementation checklist when completing Play Console. Verify every declaration against the production build and current providers before submission.

## Data processed
- Account data: name, email, login identifiers, verification state.
- Subscription data: provider, product/subscription identifiers, status and renewal dates. Card numbers are not stored by Sin Barreras.
- User content: typed text, translations, saved phrases, learning progress, QR conversation turns required to deliver the session.
- Audio: uploaded only when the user activates a voice feature; processed for transcription/translation/pronunciation. Raw audio is not stored in account history.
- Images: uploaded only when the user chooses camera/image analysis; raw images are not stored in account history.
- Technical/security data: request counters, AI usage metrics, timestamps, rate-limit/security logs and hosting network logs.
- Safety reports: content/reason attached to AI and QR reports.

## Primary purposes
- App functionality
- Account management
- Subscription/access management
- Security, abuse prevention and moderation
- Analytics limited to service operation/cost tracking

## Sharing/processors
Production may send data to providers required for the requested feature, including OpenAI, MongoDB Atlas, Render, Stripe, Google Play/Google OAuth and the configured SMTP provider. Keep the Play Console form consistent with the providers actually enabled in production.

## User controls
- Public privacy policy: `/privacy`
- Terms: `/terms`
- In-app account deletion and public deletion page: `/account-deletion`
- AI content reporting inside the app
- QR participant/message reporting and blocking
- Microphone/camera permissions are requested only for features that require them
