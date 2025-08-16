const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Webhook endpoint secret (you'll get this from Stripe dashboard)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
        
        // Log the successful coffee support payment
        console.log(`☕️ Coffee support received: $${paymentIntent.amount/100} ${paymentIntent.currency.toUpperCase()}`);
        console.log(`   Description: ${paymentIntent.description}`);
        console.log(`   Customer: ${paymentIntent.receipt_email || 'Anonymous'}`);
        
        // Here you could:
        // 1. Send a thank you email
        // 2. Log to analytics
        // 3. Update a database
        // 4. Send a Slack notification
        
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`❌ Payment failed: ${failedPayment.id}`);
        console.log(`   Error: ${failedPayment.last_payment_error?.message || 'Unknown error'}`);
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log(`💳 Payment method attached: ${paymentMethod.id}`);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
