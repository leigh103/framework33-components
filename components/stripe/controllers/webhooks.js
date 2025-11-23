
import crypto from 'crypto'

const route = 'webhooks/stripe'

Routes.get(route, grantAccess(Settings.permissions.dashboard), async (_req, res) => {
    res.render('webhook-test')
})

Routes.post(route, async (req, res) => {
    try {
        const sig = req.headers['stripe-signature']
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

        if (!endpointSecret) {
            console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
            return res.status(500).json({ error: 'Webhook secret not configured' })
        }

        // Skip signature verification for test requests
        let event
        if (req.headers['x-test-webhook']) {
            // console.log('⚠️  Test webhook - skipping signature verification')
            event = req.body
        } else {
            // Verify webhook signature for real webhooks
            try {
                const payload = JSON.stringify(req.body)
                const elements = sig.split(',')
                const signature = elements.find(el => el.startsWith('v1=')).split('=')[1]
                const timestamp = elements.find(el => el.startsWith('t=')).split('=')[1]

                const expectedSignature = crypto
                    .createHmac('sha256', endpointSecret)
                    .update(timestamp + '.' + payload)
                    .digest('hex')

                if (signature !== expectedSignature) {
                    console.error('Invalid webhook signature')
                    return res.status(400).json({ error: 'Invalid signature' })
                }

                event = req.body
            } catch (err) {
                console.error('Webhook signature verification failed:', err)
                return res.status(400).json({ error: 'Webhook signature verification failed' })
            }
        }

        // console.log('Received Stripe webhook:', event.type, event.id)

        // Process different event types
        switch (event.type) {
            // Payment Intent events - just log, don't save to InvoicePayments
            case 'payment_intent.created':
            case 'payment_intent.succeeded':
            case 'payment_intent.payment_failed':
            case 'payment_intent.canceled':
                handlePaymentIntentEvent(event)
                break

            // Charge events - save to InvoicePayments
            case 'charge.succeeded':
                await handleChargeSucceeded(event.data.object)
                break

            case 'charge.failed':
                await handleChargeFailed(event.data.object)
                break

            case 'charge.updated':
                await handleChargeUpdated(event.data.object)
                break

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object)
                break

            // Refund events - save to InvoicePayments
            case 'refund.created':
            case 'refund.updated':
                await handleRefundEvent(event.data.object)
                break

            // Customer events - save to InvoicePayments
            case 'customer.created':
            case 'customer.updated':
                await handleCustomerEvent(event)
                break

            // Payment method events - save to InvoicePayments
            case 'payment_method.attached':
            case 'payment_method.detached':
                await handlePaymentMethodEvent(event)
                break

            default:
                // console.log('Unhandled webhook event type:', event.type)
        }

        res.json({ received: true, event_type: event.type })

    } catch (error) {
        console.error('Webhook processing error:', error)
        res.status(500).json({ error: 'Webhook processing failed' })
    }
})

// Centralized transaction save function
async function saveTransaction(transactionData, options = {}) {
    try {
        const { allowUpdate = true, logPrefix = 'Processing' } = options
        // console.log(`${logPrefix}:`, transactionData.provider_transaction_id)

        const invoicePayments = new InvoicePayments()
        const existingTransaction = await invoicePayments.find({
            provider_transaction_id: transactionData.provider_transaction_id,
            provider: transactionData.provider
        })

        if (existingTransaction.found()) {
            if (allowUpdate) {
                // Update existing transaction
                // console.log('Updating existing transaction:', transactionData.provider_transaction_id)
                Object.assign(existingTransaction.data, transactionData)
                existingTransaction.data.provider_metadata.webhook_updated = new Date().toISOString()
                await existingTransaction.save()
                // console.log('Updated transaction in InvoicePayments:', transactionData.provider_transaction_id)
            } else {
                // console.log('Transaction already exists, skipping:', transactionData.provider_transaction_id)
            }
        } else {
            // Create new transaction
            const newInvoicePayments = new InvoicePayments(transactionData)
            await newInvoicePayments.save()
            // console.log('Saved new transaction to InvoicePayments:', transactionData.provider_transaction_id)
        }

    } catch (error) {
        console.error('Error saving transaction:', error)
        throw error
    }
}

// Parse charge data into standardized format
function parseChargeData(charge, eventType) {
    const status = charge.status === 'succeeded' ? 'completed' :
        charge.status === 'failed' ? 'failed' : 'pending'

    return {
        provider: 'stripe',
        provider_transaction_id: charge.id,
        provider_reference: charge.payment_intent,
        provider_status: charge.status,
        provider_metadata: {
            stripe_charge: charge,
            webhook_created: new Date().toISOString(),
            ...(eventType === 'charge.updated' && { created_from: 'charge.updated' }),
            ...(charge.failure_message && { failure_reason: charge.failure_message })
        },
        payment_method: 'card',
        amount: charge.amount,
        currency: charge.currency,
        status: status,
        description: eventType === 'charge.failed' ?
            `Stripe charge failed: ${charge.failure_message}` :
            eventType === 'charge.updated' ?
                'Stripe charge (created from update event)' :
                'Stripe charge succeeded'
    }
}

// Parse refund data into standardized format
function parseRefundData(refund, originalChargeId = null) {
    return {
        provider: 'stripe',
        provider_transaction_id: refund.id,
        provider_reference: originalChargeId || refund.charge,
        provider_status: refund.status,
        provider_metadata: {
            stripe_refund: refund,
            webhook_created: new Date().toISOString(),
            ...(originalChargeId && { original_charge: originalChargeId })
        },
        payment_method: 'card',
        amount: -refund.amount, // Negative for refund
        currency: refund.currency,
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
        description: `Stripe refund: ${refund.id}`
    }
}

// Payment Intent events - just log to console
function handlePaymentIntentEvent(event) {
    const paymentIntent = event.data.object
    console.log(`Payment Intent ${event.type}:`, {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
    })
}

// Charge events - use centralized save function
async function handleChargeSucceeded(charge) {
    const transactionData = parseChargeData(charge, 'charge.succeeded')
    await saveTransaction(transactionData, { allowUpdate: false, logPrefix: 'Processing charge.succeeded' })
}

async function handleChargeFailed(charge) {
    const transactionData = parseChargeData(charge, 'charge.failed')
    await saveTransaction(transactionData, { allowUpdate: false, logPrefix: 'Processing charge.failed' })
}

async function handleChargeUpdated(charge) {
    const transactionData = parseChargeData(charge, 'charge.updated')
    await saveTransaction(transactionData, { allowUpdate: true, logPrefix: 'Processing charge.updated' })
}

async function handleChargeRefunded(charge) {
    try {
        // console.log('Processing charge.refunded:', charge.id)

        if (charge.refunds && charge.refunds.data) {
            for (const refund of charge.refunds.data) {
                const transactionData = parseRefundData(refund, charge.id)
                await saveTransaction(transactionData, { allowUpdate: false, logPrefix: 'Processing refund from charge.refunded' })
            }
        }
    } catch (error) {
        console.error('Error handling charge.refunded:', error)
    }
}

async function handleRefundEvent(refund) {
    const transactionData = parseRefundData(refund)
    await saveTransaction(transactionData, { allowUpdate: true, logPrefix: 'Processing refund event' })
}

// Customer events - just log for now
async function handleCustomerEvent(event) {
    const customer = event.data.object
    console.log(`Customer ${event.type}:`, {
        id: customer.id,
        email: customer.email,
        created: customer.created
    })
}

// Payment method events - just log for now
async function handlePaymentMethodEvent(event) {
    const paymentMethod = event.data.object
    console.log(`Payment Method ${event.type}:`, {
        id: paymentMethod.id,
        type: paymentMethod.type,
        customer: paymentMethod.customer
    })
}
