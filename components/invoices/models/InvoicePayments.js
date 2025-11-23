import Models from '../../../core/services/Models.js'
import Invoices from './Invoices.js'

class InvoicePayments extends Models {

    constructor(data){

        super(data)

        this.settings = {
            collection: 'invoice_payments',
            view:'payment',
            show_fields: ['reference','invoice_reference', 'description','provider','amount','_created'],
            search_fields:['name','amount', 'invoice_reference'],
            header_field:'reference'
        }

        this.joins = [
            {collection: 'invoices', to:'_parent_id', return:'_parent', show:['_id','reference'], first:true},
            {collection:'users',to:'_user_id', first: true, return:'_user', show:['_id','name','email','tel']}
        ]
    
        this.providers = Settings.payments && Settings.payments.providers ? Settings.payments.providers : []

        this.providers.push(
            {text:'Cash', value:'cash'},
            {text:'Card', value:'card'},
            {text:'BACS', value:'bacs'},
            {text:'other', value:'other'}
        )

        this.statuses = [
            {text:'Pending', value:'pending'},
            {text:'Completed', value:'completed'},
            {text:'Failed', value:'failed'},
        ]

        this.fields = [
            
            {name:'_parent_id', label:'Invoice', input_type:'parent', type:'string', collection: 'invoices', value_field:'_id', text_field:'reference', tab:'sidebar'},
            {name:'_account_id', label:'Account', input_type:'parent', type:'string', tab:'sidebar'},
            {name:'_user_id', label:'Recipient', input_type:'parent', type:'string', tab:'sidebar'},
            {name:'_parent.total_outstanding', label:'Outstanding', input_type:'list', type:'price', tab:'sidebar'},
            {name:'_created', label:'Payment processed on', input_type:'datetime', type:'date'},
            {name:'reference', tab:'sidebar', input_type:'hidden', type:'string', table_link: true},
            {name:'invoice_reference', input_type:'list', type:'string', hide: 'record._id'},
            {name:'description', input_type:'text', type:'string', required: true},
            {name:'_created', tab:'sidebar', input_type:'list',type:'date',format:'DD/MM/YY h:mma'},
            {name:'provider', input_type:'select', type:'string', options: this.providers},
            {name:'amount', label:'Payment amount', input_type:'text', type:'price'},
            
            // Provider-specific fields for multi-provider support
            {name:'provider_transaction_id', label:'Provider Transaction ID', input_type:'text', type:'string', tab:'provider'},
            {name:'provider_reference', label:'Provider Reference', input_type:'text', type:'string', tab:'provider'},
            {name:'provider_status', label:'Provider Status', input_type:'text', type:'string', tab:'provider'},
            {name:'provider_metadata', label:'Provider Metadata', input_type:'object', type:'object', tab:'provider'},
            {name:'webhook_data', label:'Webhook Data', input_type:'object', type:'object', tab:'provider'},
            {name:'payment_method', label:'Payment Method', input_type:'select', type:'string', tab:'provider', options: [
                {text:'Card', value:'card'},
                {text:'Bank Transfer', value:'bank_transfer'},
                {text:'Digital Wallet', value:'digital_wallet'},
                {text:'Cash', value:'cash'},
                {text:'Other', value:'other'}
            ]},
            {name:'provider_fees', label:'Provider Fees', input_type:'price', type:'price', tab:'provider'},
            {name:'net_amount', label:'Net Amount', input_type:'price', type:'price', tab:'provider'}
        ]

        this.routes = {
            administrators: Settings.permissions.groups.administrators
        }

    }

    async preSave(){

        return new Promise( async (resolve, reject) => {

            if (!this.data.reference){
                await this.setReference('P')
            }

            if (typeof this.data.amount_str == 'string'){
                this.data.amount = view.parsePriceString(this.data.amount_str)
            }

            if (this.data._parent && this.data._parent.reference){
                this.data.invoice_reference = this.data._parent.reference
            }

            if (this.data._parent && this.data.amount && this.data._parent.total_outstanding < this.data.amount){
                reject('The payment amount is more than is owed on the invoice. Pleasse lower the amount to a maximum of '+view.parseCurrency(this.data._parent.total_outstanding))
            }

            // Calculate net_amount if not provided but provider_fees is available
            if (this.data.amount && this.data.provider_fees && !this.data.net_amount) {
                this.data.net_amount = this.data.amount - this.data.provider_fees
            }

            resolve(this)

        })


    }

    async postSave(){

        if (this.data._parent_id){
            let invoice = await new Invoices().find(this.data._parent_id)
            if (invoice.found()){
                invoice.calcTotals()
                invoice.save()
            }
        }

    }

  


}

export default InvoicePayments