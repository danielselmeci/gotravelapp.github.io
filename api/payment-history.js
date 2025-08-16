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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId is required'
      });
    }

    console.log(`🔍 Fetching payment history for user: ${userId}`);

    // Fetch payments from Stripe
    // Note: In a real app, you'd store user-payment relationships in a database
    // For now, we'll get recent payments and filter by metadata or description
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 50,
      expand: ['data.charges', 'data.refunds']
    });

    console.log(`📡 Retrieved ${paymentIntents.data.length} payment intents from Stripe`);

    // Debug: Log first few payment intents to see metadata structure
    if (paymentIntents.data.length > 0) {
      console.log(`🔍 Sample payment metadata:`, JSON.stringify(paymentIntents.data[0].metadata, null, 2));
    }

    // Filter and format payments for this user
    const userPayments = paymentIntents.data
      .filter(pi => {
        // Filter by user ID in metadata AND only show completed payments
        const hasMetadata = pi.metadata && pi.metadata.userId === userId && pi.metadata.source === 'gotravelapp_coffee_support';
        const isCompleted = pi.status === 'succeeded' || pi.status === 'refunded' || (pi.status === 'canceled' && pi.amount_received > 0);
        
        if (pi.metadata) {
          console.log(`🔍 Payment ${pi.id}: userId=${pi.metadata.userId}, status=${pi.status}, completed=${isCompleted}, match=${hasMetadata && isCompleted}`);
        }
        return hasMetadata && isCompleted;
      })
      .map(pi => {
        const refundStatus = getRefundStatus(pi);
        const refundAmount = getRefundAmount(pi);
        
        console.log(`🔍 Payment ${pi.id}:`);
        console.log(`   Charges: ${pi.charges?.data?.length || 0}`);
        console.log(`   Refunds: ${pi.refunds?.data?.length || 0}`);
        if (pi.charges?.data?.length > 0) {
          const charge = pi.charges.data[0];
          console.log(`   Charge refunded: ${charge.refunded}`);
          console.log(`   Amount refunded: ${charge.amount_refunded || 0} / ${charge.amount}`);
        }
        console.log(`   Calculated refund status: ${refundStatus}`);
        console.log(`   Calculated refund amount: ${refundAmount}`);
        
        return {
          id: pi.id,
          paymentIntentId: pi.id,
          amount: pi.amount / 100, // Convert from cents
          currency: pi.currency,
          description: pi.description || 'Support Payment',
          status: mapStripeStatus(pi.status),
          createdAt: new Date(pi.created * 1000).toISOString(),
          refundStatus: refundStatus,
          refundAmount: refundAmount,
          refundReason: null, // Would come from your database
          refundRequestedAt: null // Would come from your database
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Most recent first

    console.log(`✅ Returning ${userPayments.length} payments for user`);

    res.status(200).json({
      payments: userPayments,
      hasMore: false,
      total: userPayments.length
    });

  } catch (error) {
    console.error('❌ Payment history fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch payment history'
    });
  }
};

function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'succeeded': return 'succeeded';
    case 'pending': return 'pending';
    case 'requires_payment_method': return 'pending';
    case 'requires_confirmation': return 'pending';
    case 'requires_action': return 'pending';
    case 'processing': return 'pending';
    case 'requires_capture': return 'pending';
    case 'canceled': return 'canceled';
    default: return 'failed';
  }
}

function getRefundStatus(paymentIntent) {
  if (!paymentIntent.charges || !paymentIntent.charges.data.length) {
    return 'none';
  }

  const charge = paymentIntent.charges.data[0];
  
  // Check if payment has been refunded
  if (charge.refunded && charge.amount_refunded > 0) {
    // Fully refunded
    if (charge.amount_refunded === charge.amount) {
      return 'completed';
    }
    // Partially refunded
    return 'completed'; // We'll use 'completed' for both full and partial for now
  }

  // Check if refund is processing
  if (paymentIntent.refunds && paymentIntent.refunds.data.length > 0) {
    const latestRefund = paymentIntent.refunds.data[0];
    if (latestRefund.status === 'pending') {
      return 'processing';
    }
    if (latestRefund.status === 'succeeded') {
      return 'completed';
    }
    if (latestRefund.status === 'failed') {
      return 'rejected';
    }
  }

  return 'none';
}

function getRefundAmount(paymentIntent) {
  if (!paymentIntent.charges || !paymentIntent.charges.data.length) {
    return null;
  }

  const charge = paymentIntent.charges.data[0];
  if (charge.refunded && charge.amount_refunded > 0) {
    return charge.amount_refunded / 100; // Convert from cents
  }

  return null;
}
