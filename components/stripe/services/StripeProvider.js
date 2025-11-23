import Stripe from 'stripe'


    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


    const appleDomain = async () => {
        const domain = await stripe.applePayDomains.create({
            domain_name: Settings.config.site.url.replace('https://','').replace(/\/$/,'')
        });
    }

    // appleDomain()

    const create = async (data) => {

        let site_name = Settings.config.site && Settings.config.site.name ? Settings.config.site.name : 'Melded'

        let payload = {
            amount: parseInt(data.total),
            currency: 'gbp',
            description: site_name+' - '+data.reference,
            payment_method_types: ['card'],
            setup_future_usage: 'off_session',
            metadata: {
                record_id: data._id
            }
        }

        // if (config.transactions && config.transactions.payment_methods){
        //     payload.payment_method_types = config.transactions.payment_methods
        // }

        if (data.customer && data.customer.stripe_id){
            payload.customer = data.customer.stripe_id
        }

        if (isSet(data,'customer','payments','stripe')){
            payload.customer = data.customer.payments.stripe.id
        }

        return await stripe.paymentIntents.create(payload)

    }

    const refund = async (data) => {

        let payload = {
            payment_intent:data.id
        }

        if (data.payment_intent){
            payload.payment_intent = data.payment_intent
        }

        if (data.amount){
            payload.amount = data.amount
        }

        if (data.refund_reason){
            payload.metadata = {
                refund_reason: data.refund_reason
            }
        }

        return await stripe.refunds.create(payload)
    }

    const addCustomer = async (data) => {
        let result = ''

        try {
            result = await stripe.customers.create(data)
        }

        catch(err){
            console.log(err)
        }
        return result
    }

    const getPayments = async (query) => {

        let options = {expand: ['data.charges.data.balance_transaction']}

        if (query.limit){
            options.limit = query.limit
        } else {
            options.limit = 50
        }

        if (query.date_from && query.date_to){
            options.created = {
                gte:new Date(query.date_from).getTime()/1000,
                lte:new Date(query.date_to).getTime()/1000
            }
        }

        let result = []
        for await (const payment of stripe.paymentIntents.list(options)) {
            
            result = result.concat(payment)
        }

        for await (const refund of stripe.refunds.list(options)) {
            console.log(payment.charges.data)
            result = result.concat(refund)
        }

        result.sort((a,b)=>{
            return a.created - b.created
        })

        if (result.length > 0){
            return result
        } else {
            return []
        }

    }

    const getFees = async (charges) => {

        let result = 0

        if (typeof charges == 'string'){

            let obj = await stripe.balanceTransactions.retrieve(charges)
            result = obj.fee

        } else if (Array.isArray(charges)){

            for (var charge of charges){
                let obj = await stripe.balanceTransactions.retrieve(charge.balance_transaction)
                result += obj.fee
            }

        }

        

        return result
    
    }

    const getCustomers = async () => {
        // const listResponse = await client.customers.list()
        // return listResponse.customers
    }

export { create, addCustomer, refund, getPayments, getFees }