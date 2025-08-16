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
    const { client_secret, apple_pay_token, transaction_identifier } = req.body;

    // Validate required fields
    if (!client_secret || !apple_pay_token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'client_secret and apple_pay_token are required'
      });
    }

    // Extract payment intent ID from client secret
    const paymentIntentId = client_secret.split('_secret_')[0];

    console.log(`🔄 Confirming payment intent: ${paymentIntentId} with Apple Pay token`);
    console.log(`🍎 Transaction ID: ${transaction_identifier}`);

    // Try to decode and understand the Apple Pay token structure
    let applePayData;
    try {
      const decodedData = Buffer.from(apple_pay_token, 'base64').toString('utf8');
      applePayData = JSON.parse(decodedData);
      console.log('🍎 Apple Pay token structure:', {
        version: applePayData.version,
        hasData: !!applePayData.data,
        hasSignature: !!applePayData.signature,
        hasHeader: !!applePayData.header
      });
    } catch (error) {
      console.log('Could not decode Apple Pay token as JSON, trying as raw token');
    }

    // Try multiple approaches to handle the Apple Pay token
    console.log('🔄 Attempting to confirm payment with Apple Pay...');

    // The Apple Pay token from iOS is base64 encoded payment data
    // We need to create a proper Stripe token from this data
    
    try {
      // For Apple Pay, let's try using Stripe's Sources API which is designed for Apple Pay
      console.log('🔄 Creating Stripe source from Apple Pay data...');
      
      const source = await stripe.sources.create({
        type: 'card',
        token: apple_pay_token
      });
      
      console.log(`✅ Created Stripe source: ${source.id}`);
      
      // Confirm payment intent with the source
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        source: source.id
      });
      
      console.log(`✅ Payment confirmed successfully: ${paymentIntent.status}`);
      return res.status(200).json({
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        method: 'stripe_source'
      });
      
    } catch (sourceError) {
      console.log('❌ Stripe source creation failed:', sourceError.message);
      console.log('❌ Source error details:', JSON.stringify(sourceError, null, 2));
      
      // Approach 2: Try direct payment_method_data approach
      try {
        console.log('🔄 Trying direct payment_method_data approach...');
        
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method_data: {
            type: 'card',
            card: {
              token: apple_pay_token
            }
          }
        });
        
        console.log(`✅ Payment confirmed via direct method: ${paymentIntent.status}`);
        return res.status(200).json({
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          method: 'direct_payment_method_data'
        });
        
      } catch (directError) {
        console.log('❌ Direct approach also failed:', directError.message);
        console.log('❌ Direct error details:', JSON.stringify(directError, null, 2));
        
        // Log more details for debugging
        console.log('🔍 Apple Pay token length:', apple_pay_token.length);
        console.log('🔍 Apple Pay token preview:', apple_pay_token.substring(0, 100) + '...');
        
        throw new Error(`All Apple Pay processing approaches failed. Source: ${sourceError.message}, Direct: ${directError.message}`);
      }
    }

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
