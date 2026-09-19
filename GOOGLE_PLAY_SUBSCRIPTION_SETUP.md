# Sin Barreras · Google Play Subscription Setup

## Producto
- App package: `com.promptworks.sinbarreras`
- Subscription product ID: `sin_barreras_monthly`

## Base plan
- Base plan ID: `monthly`
- Type: Auto-renewing
- Billing period: 1 month
- U.S. price: `$5.99`
- Activate the base plan in every region where Sin Barreras will be sold.

## 7-day free-trial offer
- Offer ID: `trial-7-days`
- Eligibility: New customer acquisition / never had a subscription in this app
- Phase: Free trial
- Duration: 7 days
- Offer tag: `sb-7-day-trial`
- Regions: match the monthly base plan
- Activate the offer.

Google Play determines eligibility. The Android client queries eligible offers live, prioritizes the tagged 7-day trial when available, and falls back to the normal monthly base plan for ineligible users.

## Render variables
```env
GOOGLE_PLAY_PACKAGE_NAME=com.promptworks.sinbarreras
GOOGLE_PLAY_PRODUCT_ID=sin_barreras_monthly
GOOGLE_PLAY_FREE_TRIAL_DAYS=7
GOOGLE_PLAY_TRIAL_OFFER_TAG=sb-7-day-trial
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY=...
GOOGLE_PLAY_MONTHLY_AMOUNT=599
GOOGLE_PLAY_CURRENCY=usd
```

## Test before production
1. Add the Google account under License testing.
2. Install the Internal Testing build from Google Play.
3. Confirm an eligible tester sees the 7-day trial in the official Google checkout.
4. Confirm a non-eligible tester falls back to the monthly base plan.
5. Complete a test purchase and confirm MongoDB stores `billingProvider=google_play` and either `subscriptionStatus=trialing` or `active`.
6. Confirm Manage subscription opens the Google Play subscription center.
