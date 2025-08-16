# GoTravelApp Backend

Serverless backend for handling Stripe payments in GoTravelApp's "Buy Me a Coffee" feature.

## 🚀 Quick Setup

### 1. Deploy to Vercel

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

2. **Add Environment Variables in Vercel:**
   - In your Vercel project dashboard, go to "Settings" > "Environment Variables"
   - Add these variables:
     ```
     STRIPE_SECRET_KEY = sk_live_your_stripe_secret_key_here
     STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret_here
     ```

### 2. Configure Stripe Webhook

1. **Go to Stripe Dashboard:**
   - Navigate to "Developers" > "Webhooks"
   - Click "Add endpoint"
   - Endpoint URL: `https://your-vercel-domain.vercel.app/api/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret and add it to Vercel environment variables

### 3. Update Your iOS App

Update the `backendURL` in `PaymentService.swift`:

```swift
private let backendURL = "https://your-vercel-domain.vercel.app"
```

## 📡 API Endpoints

### POST /api/create-payment-intent
Creates a Stripe payment intent for coffee support payments.

**Request:**
```json
{
  "amount": 500,
  "currency": "usd",
  "description": "Coffee support payment"
}
```

**Response:**
```json
{
  "client_secret": "pi_xxxxx_secret_xxxxx",
  "amount": 500,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

### POST /api/webhook
Handles Stripe webhook events.

### GET /api/health
Health check endpoint.

## 🔧 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

3. Start development server:
   ```bash
   vercel dev
   ```

4. Your API will be available at `http://localhost:3000/api/`

## 🛡️ Security Features

- CORS headers configured for your app
- Webhook signature verification
- Input validation and sanitization
- Comprehensive error handling
- Request method validation

## 📊 Monitoring

The webhook endpoint logs all payment events:
- ✅ Successful payments
- ❌ Failed payments
- 💳 Payment method changes

You can view these logs in your Vercel dashboard under "Functions" > "Logs".

## 🚨 Important Notes

- **Never commit secrets** to GitHub
- Use environment variables for all sensitive data
- Test with Stripe test keys before going live
- Monitor webhook endpoints for failures
- Set up alerts for payment failures

## 🎯 Production Checklist

- [ ] Stripe live keys configured in Vercel
- [ ] Webhook endpoint registered in Stripe
- [ ] CORS headers configured properly
- [ ] Error monitoring set up
- [ ] Payment logging configured
- [ ] iOS app updated with production URL
