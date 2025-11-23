import Models from '../../../core/services/Models.js'

class Invoices extends Models {

    constructor(data) {

        super(data)

        this.settings = {
            collection: 'invoices',
            view: 'invoice',
            show_fields: ['reference', 'subject', 'name', 'status', 'total', 'total_outstanding'],
            search_fields: ['reference', 'customer.name', 'customer.email', 'customer.tel', 'billing_address.postcode', 'shipping_address.postcode'],
            bulk_fields: ['status', 'invoice_checked', 'due_date'],
            header_field: 'reference',
            calendar_field: '_created',
            events: ['invoice.created', 'invoice.updated']
        }

        this.statuses = [
            { text: 'Pending', value: 'pending' },
            { text: 'Unpaid', value: 'unpaid' },
            { text: 'Direct Debit', value: 'direct_debit' },
            { text: 'Paid', value: 'paid' },
            { text: 'Cancelled', value: 'cancelled' },
            { text: 'Debt Recovery', value: 'debt_recovery' }
        ]

        this.joins = [
            { collection: 'users', from: '_user_id', first: true, return: '_user', show: ['_id', 'name', 'email', 'tel', 'payments'] },
            { collection: 'invoice_items', to: '_parent_id', return: 'items', show: ['_id', 'thumbnail', 'name', 'price', 'quantity', 'discount_applied', 'sub_total', 'tax_total', 'tax', 'total'] },
            { collection: 'invoice_payments', to: '_parent_id', return: 'payments' }
        ]

        this.fields = [
            { name: 'reference', input_type: 'hidden', type: 'string', tab: 'sidebar', table_link: true, analyzers: ['identity'] },

            { name: 'recipient_reference', input_type: 'hidden', type: 'string' },
            { name: '_user_id', label: 'Recipient', input_type: 'parent', collection: 'users', value_field: '_id', text_field: 'name', type: 'string', return_field: 'recipient', type: 'string', fields: ['name', 'email'] },

            { name: 'total', input_type: 'list', class: "heading", label: 'Total Payable', tab: 'sidebar', type: 'price'},

            { name: 'discount_total', label: 'Discounts', input_type: 'list', type: 'price', show: 'record.discount_total > 0' },
            { name: 'tax', label: 'Tax', input_type: 'list', tab: 'sidebar', type: 'price' },
            { name: 'sub_total', input_type: 'list', type: 'price', tab: 'sidebar', style: 'margin-bottom: 1rem;' },


            { name: 'total_paid', input_type: 'list', type: 'price', tab: 'sidebar' },
            { name: 'total_outstanding', input_type: 'list', type: 'price', tab: 'sidebar' },
            { name: 'refund_total', input_type: 'list', type: 'price', tab: 'sidebar', style: 'margin-bottom: 1rem;' },
            { name: 'status', input_type: 'list', options: this.statuses, type: 'string', tab: 'sidebar', required: true, style: 'margin-bottom: 1rem;'},

            { name: '_created', input_type: 'list', type: 'date', tab: 'sidebar', format: "D/MM/YY h:mma" },
            { name: '_sent', label: 'Sent on', input_type: 'list', tab: 'sidebar', type: 'date', format: "D/MM/YY h:mma" },
            { name: '_reminder', label: 'Reminder Sent', input_type: 'list', tab: 'sidebar', type: 'date', style: 'margin-bottom: 1rem;', format: "D/MM/YY h:mma" },
            { name: '_user' },

            { name: 'issue', label: false, type: 'string', input_type: 'paragraph', class: 'error', show: 'record.issue' },

            { name: 'subject', input_type: 'text', type: 'string', label: 'Invoice Subject', table_group: true, analyzers: ['text_en', 'identity'] },


            { name: '_parent_id', input_type: 'hidden', type: 'string' },

            { name: 'start_date', type: 'date', input_type: 'date' },
            { name: 'end_date', type: 'date', input_type: 'date' },
            { name: 'due_date', input_type: 'date', type: 'date' },

            { name: 'purchase_order', input_type: 'text', type: 'string', label: 'Purchase Order Number' },

            {
                name: 'items', tab: 'items', label: false, input_type: 'object_array', subitems: [
                    { name: 'thumbnail', input_type: 'image' },
                    { name: 'name', input_type: 'text', label: 'Item Name', table_link: true },
                    { name: 'price', input_type: 'price', table_show: true },
                    { name: 'quantity', input_type: 'number', table_show: true },
                    { name: 'discount_applied', type: 'string' },

                    { name: 'sub_total', input_type: 'price', table_show: true },
                    { name: 'tax', input_type: 'price'},
                    { name: 'tax_total', input_type: 'price', table_show: true },
                    { name: 'total', input_type: 'price', table_show: true },

                ]
            },


            { name: 'delivery_method', type: 'number'},
            { name: 'requires_delivery', label: 'Delivery Required', input_type: 'checkbox', type: 'boolean' },
            { name: 'invoice_checked', label: 'Invoice Checked', input_type: 'checkbox', type: 'boolean' },
            { name: 'allow_partial_payments', label: 'Allow partial payments', input_type: 'checkbox', type: 'boolean' },
            { name: 'source', input_type: 'list', type: 'string', tab: 'sidebar', style: 'margin-top: 2rem;' },

            {
                name: 'discounts', input_type: 'hidden', type: 'object_array', subitems: [
                    { name: 'name', type: 'string' },
                    { name: 'discount_value', type: 'price' },
                    { name: 'adjustment', type: 'string' },
                    { name: 'conditions', type: 'object' },
                    { name: 'enabled', type: 'boolean' }
                ]
            },

            { name: 'credits', input_type: 'hidden', type: 'object' },
            { name: 'item_total', input_type: 'hidden', type: 'price' },
            { name: 'item_count', input_type: 'hidden', type: 'object' },
            { name: 'item_full_price', input_type: 'hidden', type: 'object' },
            { name: 'total_item_count', input_type: 'hidden', type: 'object' },
            { name: 'total_items', input_type: 'hidden', label: 'Total Qty', type: 'number' },

            {
                name: 'customer', input_type: 'object', type: 'object', analyzers: ['text_en', 'identity'], tab: 'recipient', subitems: [
                    { name: '_id', input_type: 'hidden', type: 'string' },
                    { name: 'stripe_id', input_type: 'hidden', type: 'string' },
                    { name: 'payments', input_type: 'hidden', type: 'object' },
                    { name: 'title', input_type: 'select', options: [{ text: 'Mr', value: 'Mr' }, { text: 'Mrs', value: 'Mrs' }, { text: 'Miss', value: 'Miss' }, { text: 'Ms', value: 'Ms' }, { text: 'Dr', value: 'Dr' }], type: 'string' },
                    { name: 'name', input_type: 'text', type: 'string', required: true },
                    { name: 'email', input_type: 'email', type: 'email' },
                    { name: 'tel', input_type: 'tel', type: 'tel' },
                    { name: 'notification_method', input_type: 'select', options: [{ text: 'SMS Text', value: 'sms' }, { text: 'Email', value: 'email' }], type: 'string' }
                ]
            },

            {
                name: 'billing_address', input_type: 'object', type: 'object', tab: 'recipient', subitems: [
                    { name: 'address_line1', input_type: 'text', type: 'string' },
                    { name: 'address_line2', input_type: 'text', type: 'string' },
                    { name: 'address_level1', input_type: 'text', type: 'string' },
                    { name: 'address_level2', input_type: 'text', type: 'string' },
                    { name: 'postal_code', input_type: 'text', type: 'string' }
                ]
            },

            {
                name: 'shipping_address', input_type: 'object', type: 'object', tab: 'shipping', subitems: [
                    { name: 'title', input_type: 'select', options: [{ text: 'Mr', value: 'Mr' }, { text: 'Mrs', value: 'Mrs' }, { text: 'Miss', value: 'Miss' }, { text: 'Ms', value: 'Ms' }, { text: 'Dr', value: 'Dr' }], type: 'string' },
                    { name: 'name', input_type: 'text', type: 'string' },
                    { name: 'tel', input_type: 'text', type: 'tel' },
                    { name: 'email', input_type: 'email', type: 'email' },
                    { name: 'address_line1', label: 'Address Line 1', input_type: 'text', type: 'string' },
                    { name: 'address_line2', label: 'Address Line 2', input_type: 'text', type: 'string' },
                    { name: 'address_level1', label: 'County', input_type: 'text', type: 'string' },
                    { name: 'address_level2', label: 'City', input_type: 'text', type: 'string' },
                    { name: 'postal_code', label: 'Post Code', input_type: 'text', type: 'postcode' }
                ]
            },

            {
                name: 'payments', input_type: 'object_array', tab: 'payments', tab_weight: 10, subitems: [
                    { name: '_created', input_type: 'date', table_show: true },
                    { name: 'note', input_type: 'string', table_link: true },
                    { name: 'provider', input_type: 'string', table_show: true },
                    { name: 'amount', input_type: 'price', table_show: true },
                    { name: 'data', input_type: 'object' }
                ]
            },

            { name: '_locked', type: 'boolean', input_type: 'hidden' },
            { name: 'date_range', type: 'object', input_type: 'hidden' },
            { name: 'payments', type: 'object', input_type: 'hidden' },
            { name: 'gocardless', type: 'object', input_type: 'hidden' },
            { name: 'included', type: 'array', input_type: 'hidden' },
            { name: 'instalment_array', type: 'array', input_type: 'hidden' },
        ]

        this.filters = [
            { name: 'status', input_type: 'select', options: this.statuses },
            { name: 'from', input_type: 'date', type: 'date', placeholder: 'Date from', format: 'ddd Do MMMM YYYY h:mma' },
            { name: 'to', input_type: 'date', type: 'date', placeholder: 'Date to', format: 'ddd Do MMMM YYYY h:mma' },
        ]

        this.routes = {
            administrators: Settings.permissions.groups.administrators
        }

        this.actions = [
            { bind: 'Send Invoice', click: 'sendInvoice', hide: 'record._sent' },
            { bind: 'Send Reminder', click: 'sendReminder', show: 'record._sent' }
        ]

    }

    async all(data, sort, start, end) {

        await super.all(data, sort, start, end)

        for (var data of this.data) {

            if (data._user && data._user.name) {
                data.name = data._user.name
            }

        }

        return this

    }

    async find(key) {

        await super.find(key)

        if (this.data && this.data.status && this.data.status == 'paid' && this.data.items_archive) {
            this.data.items = this.data.items_archive
        }

        return this


    }

    async preSave(prev_data) {

        return new Promise(async (resolve, reject) => {

            if (!this.data._id) {
                this.new_record = true
            }

            if (!this.data.reference) {
                await this.setReference('IN')
            }

            if (!this.data.items) {
                this.data.items = []
            }

            if (!this.data.status) {
                this.data.status = 'pending'
            }

            if (!this.data.source) {
                this.data.source = 'manual'
            }

            if (!this.data.public_id) {
                this.data.public_id = Date.now()
                this.data.public_id = this.data.public_id.toString()
            }

            if (this.data._user) {
                this.data.customer = this.data._user
            }

            if (this.data.items && this.data.items.length > 0) {
                await this.calcTotals()
            }
            //    await this.calcTotals() // needed to apply discounts correctly - not sure why yet

            if (!this.data.due_date) {

                if (this.data.start_date) {

                    if (moment(this.data.start_date).isBefore(moment())) {

                        let due_date = isSet(Settings, 'config', 'invoice', 'due_date') ? Settings.config.invoice.due_date : 30
                        this.data.due_date = moment().add(due_date, 'days')

                    } else {
                        this.data.due_date = this.data.start_date
                    }

                } else {
                    let due_date = Settings.config.invoice && Settings.config.invoice.due_date ? Settings.config.invoice.due_date : 30
                    this.data.due_date = moment().add(due_date, 'days').toISOString()
                }

            }

            if (this.data.start_date && this.data.end_date) {

                let start_date = moment(this.data.start_date).tz('Europe/London')
                let end_date = moment(this.data.end_date).tz('Europe/London')
                this.data.date_range = {
                    years: end_date.diff(start_date, 'years'),
                    //    months: end_date.endOf('month').diff(start_date.startOf('month'), 'months'),
                    days: end_date.endOf('day').diff(start_date.startOf('day'), 'days'),
                    hours: end_date.diff(start_date, 'hours')
                }

                this.data.date_range.months = Math.round(this.data.date_range.days / 30)

                if (this.data.allow_partial_payments == true && this.data.date_range.months < 2) {
                    this.data.allow_partial_payments = false
                }

                if (this.data.date_range.months > 1) {
                    let instalment = parseInt((this.data.total / parseInt(this.data.date_range.months)).toFixed(0))

                    this.data.instalment_array = []
                    let total_check = 0

                    for (var i = 0; i < parseInt(this.data.date_range.months); i++) {
                        total_check += instalment
                        this.data.instalment_array.push(instalment)
                    }

                    if (total_check != this.data.total) { // if the installments don't add up to the total, add the difference to the first payment
                        let total_diff = parseInt(this.data.total) - total_check
                        this.data.instalment_array[0] = parseInt(this.data.instalment_array[0]) + total_diff
                    }
                }

            } else if (this.data.allow_partial_payments == true) {

                this.data.allow_partial_payments = false

            }

            resolve(this)

        })


    }

    async postSave() {

        if (this.data.status && this.data.status == 'paid') {
            this.data._locked = true
            DB.read(this.settings.collection).where(['_id == ' + this.data._id]).update({ _locked: this.data._locked, items_archive: this.data.items }).new()

            var invoice_data = {
                _id: this.data._id,
                _key: this.data._key,
                total: this.data.total,
                total: this.data.subtotal,
                total: this.data.tax,
                status: this.data.status
            }

            for (var item of this.data.items) {

                let collection = item._id.split('/')[0]
                let item_model = await new global[parseClassName(collection)]().find(item._key)

                if (item_model.found() && typeof item_model.postTransaction == 'function') {
                    await item_model.postTransaction(invoice_data)
                }

            }

        }

        if (this.data.status == 'unpaid') {
            if (this.new_record && this.new_record === true) {
                EventBus.emit(this.settings.events[0], this.data)
            } else {
                EventBus.emit(this.settings.events[1], this.data)
            }
        }



    }

    async preDelete() {

        return new Promise((resolve, reject) => {

            if (this.data && this.data.payments && this.data.payments.length > 0) {
                reject('Unable to delete this invoice as it has payments attached')
            }

            resolve(this)

        })

    }

    async calcTotals() {

        this.data.total = 0
        this.data.tax = 0
        this.data.sub_total = 0
        this.data.total_paid = 0

        await this.calcItems()

        this.data.total_outstanding = this.data.total
        await this.calcPayments()

        return this

    }

    async calcItems() {

        for (var item of this.data.items) {
            this.data.sub_total += item.sub_total
            this.data.tax += item.tax_total
            this.data.total += item.total
        }

    }

    async calcPayments() {

        for (var payment of this.data.payments) {
            this.data.total_paid += payment.amount
            this.data.total_outstanding -= payment.amount
        }

        await this.paid()

    }

    async paid() {

        if (this.data.total_outstanding == 0 && this.data.status != 'pending') {
            this.data.status = 'paid'
        }

    }

    async addItem(item_data, req) {

        if (item.data._id) {
            item_data._parent_id = this.data._id
        } else {
            item_data._parent_id = this.data._id
            item_data = await new InvoiceItems(item_data).save()
            item_data = item_data.get()
        }

        item_data = await new InvoiceItems().calcTotals(item_data)

        let collection = item_data._id.split('/')[0]
        await DB.read(collection).where(["_id == " + item_data._id]).update(item_data).new()

        await this.calcTotals()
        return this

    }

    async removeItem(item_data, req) {

        if (item.data._id) {
            item_data._parent_id = null
            let collection = item_data._id.split('/')[0]

            // if not attached to anything, delete else
            await DB.read(collection).where(["_id == " + item_data._id]).update({ _parent_id: null }).new()
        }

        await this.calcTotals()
        return this

    }

    async send(data) {

        if (!this.data && data) {
            this.data = data
        }

        if (this.data.status = 'paid') {
            this.error = 'Unable to send invoice as it has been marked as paid'
            return this
        }

        if (this.data.status = 'cancelled') {
            this.error = 'Unable to send invoice as it has been marked as cancelled'
            return this
        }

        if (this.data.customer && this.data.customer.email) {

            let payload = {
                to: this.data.customer.email,
                method: 'email'
            }

            let notification = await new Notification(payload)

            if (!this.data._sent) {

                await notification.trigger('invoice-new')
                await notification.useData(this.data)
                await notification.send()

                this.data._sent = moment().toISOString()

                if (this.data.status == 'pending') {
                    await DB.read(this.settings.collection).where(['_id == ' + this.data._id]).update({ status: 'unpaid', _sent: this.data._sent }).new()
                } else {
                    await DB.read(this.settings.collection).where(['_id == ' + this.data._id]).update({ _sent: this.data._sent }).new()
                }

            } else {

                try {
                    await notification.trigger('invoice-reminder')
                    await notification.useData(this.data)
                    await notification.send()
                }
                catch (e) {
                    this.error = e
                    return this
                }

                this.data._reminder = moment().toISOString()
                await DB.read(this.settings.collection).where(['_id == ' + this.data._id]).update({ _reminder: this.data._reminder }).new()

            }

        }

        return this

    }

    async create(data) {

        if (data._user_id) {
            let items = await DB.read('chargeable').where(['_user_id == ' + data._user_id, '_price_id has a value']).get()
            console.log(items)
        }

        return this

    }


}

export default Invoices