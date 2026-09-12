import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { stripe, stripeEnabled, ensureStripeCustomer, syncCheckoutSession } from '../services/stripeService.js';

const router = express.Router();

router.post('/checkout', requireAuth, async (request, response, next) => {
  try {
    if (!stripeEnabled()) return response.status(503).json({ error: 'Los pagos todavía no están configurados.' });
    if (request.user.role === 'owner') return response.status(403).json({ error: 'La cuenta owner tiene acceso total incluido y no puede comprar una suscripción.', code: 'OWNER_BILLING_BYPASS' });
    if (request.user.accountStatus === 'revoked') return response.status(403).json({ error: 'Esta cuenta fue revocada por el administrador y no puede crear una nueva suscripción.' });
    if (request.user.hasAppAccess()) return response.status(409).json({ error: 'Tu cuenta ya tiene acceso a Sin Barreras.' });

    const appUrl = process.env.APP_URL || `${request.protocol}://${request.get('host')}`;
    const customer = await ensureStripeCustomer(request.user);
    const amount = Number(process.env.STRIPE_MONTHLY_AMOUNT || 599);
    const currency = process.env.STRIPE_CURRENCY || 'usd';
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      billing_address_collection: 'auto',
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          recurring: { interval: 'month' },
          product_data: {
            name: 'Sin Barreras',
            description: 'Acceso completo a traducción, aprendizaje, AI Coach y cámara.'
          }
        }
      }],
      metadata: { userId: String(request.user._id) },
      subscription_data: { metadata: { userId: String(request.user._id) } },
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?billing=cancelled`
    });
    response.json({ url: session.url });
  } catch (error) { next(error); }
});

router.post('/portal', requireAuth, async (request, response, next) => {
  try {
    if (!stripeEnabled()) return response.status(503).json({ error: 'Stripe no está configurado.' });
    if (!request.user.stripeCustomerId) return response.status(400).json({ error: 'Esta cuenta no tiene una suscripción administrable.' });
    const appUrl = process.env.APP_URL || `${request.protocol}://${request.get('host')}`;
    const session = await stripe().billingPortal.sessions.create({ customer: request.user.stripeCustomerId, return_url: `${appUrl}/app` });
    response.json({ url: session.url });
  } catch (error) { next(error); }
});

router.get('/success', requireAuth, async (request, response, next) => {
  try {
    if (!stripeEnabled()) return response.redirect('/?billing=not-configured');
    const sessionId = String(request.query.session_id || '');
    if (!sessionId) return response.redirect('/?billing=missing-session');
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== String(request.user._id)) return response.status(403).send('Sesión de pago inválida.');
    await syncCheckoutSession(session, request.user);
    const refreshed = await request.user.constructor.findById(request.user._id);
    return response.redirect(refreshed?.hasAppAccess() ? '/app?welcome=1' : '/?billing=pending');
  } catch (error) { next(error); }
});

export default router;
