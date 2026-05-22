import Models from '../../../core/services/Models.js'

class SocialSubscriptions extends Models {
    constructor(data) {
        super(data)

        this.settings = {
            search_fields: ['subscriber_username', 'provider_username'],
            show_fields: ['subscriber_username', 'provider_username', 'type', 'status', '_created'],
            collection: 'social_subscriptions'
        }

        this.statuses = [
            {text: 'Active', value: 'active'},
            {text: 'Pending', value: 'pending'},
            {text: 'Cancelled', value: 'cancelled'},
            {text: 'Past Due', value: 'past_due'},
            {text: 'Trialing', value: 'trialing'}
        ]

        this.types = [
            {text: 'Friend', value: 'friend'},       // mutual connection, no payment
            {text: 'Paid', value: 'paid'}             // paid subscription to a provider
        ]

        this.fields = [
            {name: 'subscriber_id', type: 'string', input_type: 'hidden', required: true},
            {name: 'subscriber_username', type: 'string', input_type: 'disabled', required: true},
            {name: 'provider_id', type: 'string', input_type: 'hidden', required: true},
            {name: 'provider_username', type: 'string', input_type: 'disabled', required: true},
            {name: 'type', type: 'string', input_type: 'select', options: this.types, default: 'friend', required: true},
            {name: 'status', type: 'string', input_type: 'select', options: this.statuses, default: 'active'},
            {name: 'plan_id', type: 'string', input_type: 'hidden', required: false},
            {name: 'current_period_start', type: 'date', input_type: 'hidden', required: false},
            {name: 'current_period_end', type: 'date', input_type: 'hidden', required: false},
            {name: 'payment_provider', type: 'string', input_type: 'hidden', required: false},
            {name: 'payment_ref', type: 'string', input_type: 'hidden', required: false}
        ]
    }

    async updatePayment(payment_ref, update_data) {
        this.data = await DB.read(this.settings.collection)
            .where(['payment_ref == ' + payment_ref])
            .update(update_data)
        return this
    }

}

export default SocialSubscriptions
