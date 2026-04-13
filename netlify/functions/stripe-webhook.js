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

  // Helper — find Clerk userId from Stripe customer email
  async function getClerkUserId(email) {
    if (!email) return null;
    const response = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } }
    );
    const users = await response.json();
    return users?.[0]?.id || null;
  }

  // Helper — update Clerk user publicMetadata
  async function setClerkProStatus(userId, isPro) {
    if (!userId) return;
    await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_metadata: { isPro } })
    });
    console.log(`Clerk user ${userId} isPro set to ${isPro}`);
  }

  if (
    stripeEvent.type === 'customer.subscription.created' ||
    stripeEvent.type === 'invoice.payment_succeeded'
  ) {
    const email = data.customer_email || data?.customer_details?.email || null;
    const userId = await getClerkUserId(email);
    await setClerkProStatus(userId, true);
    console.log('Pro activated:', data.customer, email);
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const email = data.customer_email || null;
    const userId = await getClerkUserId(email);
    await setClerkProStatus(userId, false);
    console.log('Pro cancelled:', data.customer, email);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true })
  };
};