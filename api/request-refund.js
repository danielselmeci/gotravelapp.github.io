const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, paymentIntentId, amount, reason, requestedAt } = req.body;

    if (!userId || !paymentIntentId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, paymentIntentId, and reason are required'
      });
    }

    console.log(`🔄 Processing refund request for payment: ${paymentIntentId}`);
    console.log(`   User: ${userId}`);
    console.log(`   Amount: ${amount || 'full refund'}`);
    console.log(`   Reason: ${reason}`);

    // Fetch the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges', 'refunds']
    });

    if (!paymentIntent) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'The specified payment could not be found'
      });
    }

    console.log(`🔍 Payment Intent Debug:`);
    console.log(`   ID: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Charges count: ${paymentIntent.charges?.data?.length || 0}`);
    console.log(`   Amount: ${paymentIntent.amount}`);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Invalid payment status',
        message: `Payment status is '${paymentIntent.status}', only succeeded payments can be refunded`
      });
    }

    // Check if there's a charge to refund
    if (!paymentIntent.charges || !paymentIntent.charges.data.length) {
      console.log(`❌ No charges found for payment ${paymentIntentId}`);
      console.log(`   Payment Intent:`, JSON.stringify(paymentIntent, null, 2));
      
      return res.status(400).json({
        error: 'No charge found',
        message: 'No chargeable amount found for this payment. This might be a payment that was not completed or captured.'
      });
    }

    const charge = paymentIntent.charges.data[0];

    // Check if already fully refunded
    if (charge.refunded && charge.amount_refunded === charge.amount) {
      return res.status(400).json({
        error: 'Already refunded',
        message: 'This payment has already been fully refunded'
      });
    }

    // Calculate refund amount
    let refundAmount;
    if (amount) {
      // Partial refund
      refundAmount = Math.round(amount * 100); // Convert to cents
      
      // Check if the requested amount is valid
      const availableAmount = charge.amount - (charge.amount_refunded || 0);
      if (refundAmount > availableAmount) {
        return res.status(400).json({
          error: 'Invalid refund amount',
          message: `Cannot refund more than the available amount ($${availableAmount / 100})`
        });
      }
    } else {
      // Full refund
      refundAmount = charge.amount - (charge.amount_refunded || 0);
    }

    console.log(`💰 Refund amount: $${refundAmount / 100}`);

    // Create the refund
    const refund = await stripe.refunds.create({
      charge: charge.id,
      amount: refundAmount,
      reason: mapRefundReason(reason),
      metadata: {
        user_id: userId,
        refund_reason: reason,
        requested_at: requestedAt || new Date().toISOString()
      }
    });

    console.log(`✅ Refund created: ${refund.id}`);
    console.log(`   Status: ${refund.status}`);
    console.log(`   Amount: $${refund.amount / 100}`);

    // In a real app, you'd also update your database with the refund request
    // For now, we'll just return success

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      estimatedArrival: getEstimatedArrival(refund)
    });

  } catch (error) {
    console.error('❌ Refund request error:', error);
    
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

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process refund request'
    });
  }
};

function mapRefundReason(reason) {
  // Map our app's refund reasons to Stripe's reasons
  const reasonMap = {
    'Duplicate Charge': 'duplicate',
    'Service Not Received': 'fraudulent',
    'Billing Error': 'duplicate',
    'Customer Request': 'requested_by_customer',
    'Other': 'requested_by_customer'
  };

  return reasonMap[reason] || 'requested_by_customer';
}

function getEstimatedArrival(refund) {
  // Estimate refund arrival time based on payment method
  // This is a simplified version - in reality, it depends on many factors
  const now = new Date();
  const estimatedDays = 5; // 5-10 business days for most cards
  
  const estimatedDate = new Date(now.getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
  return estimatedDate.toISOString();
}
