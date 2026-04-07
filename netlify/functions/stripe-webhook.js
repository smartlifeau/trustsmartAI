const stripe = require('stripe');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

  let stripeEvent;
  try {
    stripeEvent = stripeClient.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: Webhook Error: ${err.message} };
  }

  const data = stripeEvent.data.object;

  switch (stripeEvent.type) {
    case 'customer.subscription.created':
    case 'invoice.payment_succeeded':
      // Store Pro status — we use Stripe customer email as the key
      console.log('Pro activated for:', data.customer_email || data.customer);
      // TODO: when Clerk is added, update user metadata here
      break;

    case 'customer.subscription.deleted':
      console.log('Pro cancelled for:', data.customer);
      // TODO: when Clerk is added, remove Pro status here
      break;

    default:
      console.log('Unhandled event type:', stripeEvent.type);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};