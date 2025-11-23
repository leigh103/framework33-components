# Stripe Payment Component

## Architecture

### Service Layer
`StripeProvider.js` - Contains all Stripe functionality that controllers consume
- Payment creation
- Refund processing  
- Customer management
- Transaction retrieval
- Fee calculation

### Controller Layer
Controllers consume StripeProvider functionality and handle HTTP requests/responses

#### Checkout Controller (`index.js`)
Handles customer-facing checkout routes for setting up payment intents
- Route base: `/checkout/stripe`
- `GET /checkout/stripe` - Renders payment processing page
- Controller renders EJS templates when necessary

#### Webhook Controller (`webhooks.js`)
Handles Stripe webhook events posted to single endpoint
- Route: `POST /webhooks/stripe`
- **Webhook signature verification** (Stripe security requirement)
- **Event type switch statement** to route different events
- **Individual handler functions** for each event type
- **Extensible design** - easy to add more event types

**Events handled:**
- **Payment Events:**
  - `payment_intent.succeeded` - Payment completed successfully
  - `payment_intent.payment_failed` - Payment failed
  - `payment_intent.canceled` - Payment canceled
- **Refund Events:**
  - `charge.refunded` - Refund processed
  - `refund.created` - New refund created
  - `refund.updated` - Refund status changed

**Each handler:**
- Finds existing InvoicePayments record by Stripe transaction ID
- Updates status and metadata from Stripe event data
- Creates new records for refunds (negative amounts)

### Views Layer
EJS templates located in `views/` folder
- `payment.ejs` - Payment processing page using Stripe Elements
- Rendered by controller with necessary data (PaymentIntent client_secret, amount, currency, etc.)

### Data Storage
All transaction information is stored in the globally available `InvoicePayments` model