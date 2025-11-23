
import { create, addCustomer, refund, getPayments, getFees } from '../services/StripeProvider.js'

const route = 'checkout/stripe'

Routes.get(route, async (req, res) => {
    // Render the payment page
    res.render('payment', {
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        amount: req.query.amount || 1000,
        currency: req.query.currency || 'gbp',
        description: req.query.description || 'Payment'
    })
})

Routes.post(route, async (req, res) => {
    try {
        // Create payment intent using StripeProvider
        const paymentData = {
            total: req.body.amount || 1000,
            currency: req.body.currency || 'gbp',
            reference: req.body.reference || 'Payment',
            _id: req.body.record_id
        }

        const paymentIntent = await create(paymentData)

        // Return client secret for frontend
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        })

    } catch (error) {
        console.error('Payment intent creation error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create payment intent'
        })
    }
})

