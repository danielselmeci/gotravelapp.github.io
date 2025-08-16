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
    const { amount, currency = 'usd', description = 'GoTravel App Support', metadata = {} } = req.body;

    // Validate required fields
    if (!amount || amount < 50) { // Minimum $0.50
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be at least $0.50 (50 cents)'
      });
    }

    if (amount > 99999) { // Maximum $999.99
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount cannot exceed $999.99'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer (cents)
      currency: currency.toLowerCase(),
      description: description,
      payment_method_types: ['card'],
      metadata: {
        ...metadata, // Include user metadata from iOS app
        source: 'gotravelapp_coffee_support',
        timestamp: new Date().toISOString()
      }
    });

    // Log successful payment intent creation (for monitoring)
    console.log(`✅ Payment intent created: ${paymentIntent.id} for $${amount/100}`);

    // Return the client secret to the app
    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('❌ Payment intent creation failed:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: 'Card error',
        message: error.message
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
      message: 'An unexpected error occurred'
    });
  }
};
