exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing signature or secret' }) };
  }

  let stripeEvent;
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }

  const data = stripeEvent.data.object;

  if (stripeEvent.type === 'customer.subscription.created' || stripeEvent.type === 'invoice.payment_succeeded') {
    console.log('Pro activated:', data.customer);
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    console.log('Pro cancelled:', data.customer);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true })
  };
};