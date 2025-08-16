const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { client_secret, payment_token } = req.body;

    // Validate required fields
    if (!client_secret || !payment_token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'client_secret and payment_token are required'
      });
    }

    // Extract payment intent ID from client secret
    const paymentIntentId = client_secret.split('_secret_')[0];

    console.log(`🔄 Confirming payment intent: ${paymentIntentId} with Apple Pay token`);

    // For Apple Pay, create a token directly from the payment data
    console.log('Apple Pay token received');

    // Create payment method from Apple Pay token
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: payment_token.id
      }
    });

    console.log(`✅ Created payment method: ${paymentMethod.id}`);

    // Confirm the payment intent with the payment method
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.id
    });

    console.log(`✅ Payment confirmation result: ${paymentIntent.status}`);

    // Return the payment intent status
    res.status(200).json({
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      payment_method: paymentMethod.id
    });

  } catch (error) {
    console.error('❌ Payment confirmation failed:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: 'Card error',
        message: error.message,
        decline_code: error.decline_code
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message
      });
    }

    if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        error: 'API error',
        message: 'An error occurred with our payment processor'
      });
    }

    if (error.type === 'StripeConnectionError') {
      return res.status(500).json({
        error: 'Connection error',
        message: 'Network error occurred'
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({
        error: 'Authentication error',
        message: 'Payment processor authentication failed'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during payment confirmation'
    });
  }
};
