import Prices from '../../../core/models/Prices.js'

class InvoiceItems extends Prices {

    constructor(data){

        super(data)

        this.settings = {
            collection: 'invoice_items',
            view:'chargeable',
            show_fields: ['name','total'],
            search_fields:['name','total']
        }

        this.joins = [
            {collection: 'invoices', from:'_parent_id', return:'_parent', show:['_id','reference'], first:true},
            {from:'_user_id', collection:'users', return:'_user', first:true, show:['_id','name', 'tel','email']},
            {from:'_price_id', collection:'prices', return:'_price', first:true},
        ]

        this.fields = [

            {name:'name',input_type:'text', type:'string', required:true, table_link:true, style:'margin-bottom: 2rem;'},

            {name:'_parent_id', label:'Invoice', input_type:'parent', type:'string', collection: 'invoices', value_field:'_id', text_field:'reference', fields:['reference']},
            {name:'_account_id', label:'Account', input_type:'hidden', type:'string'},
            {name:'_user_id', label:'Recipient', input_type:'parent', collection: 'users', type:'string', style:'margin-bottom: 2rem;'},
            
  

            {name:'_price_id', label:'Use a preset price',input_type:'parent', collection:'prices', type:'string',value_field: '_id', text_field:'name'},
       
            {name:'quantity', input_type:'number', type:'number'},

            {name:'type', label:'Price type', input_type:'hidden', type:'string'},
            
            {name:'target_price', label:'Set Price', input_type:'text', type:'price', hide:'record._price_id'},
            {name:'cost_price', label:'Cost Price', input_type:'text', type:'price', hide:'record._price_id'},
            {name:'markup', label:'Markup', input_type:'text', type:'price', hide:'record._price_id'},
            {name:'vat', label:'vat', input_type:'text', type:'string', hide:'record._price_id'},

            {name:'price', input_type:'list', type:'price', tab:'sidebar'},
            {name:'price_ex_vat', input_type:'list', type:'price', tab:'sidebar'},
            
            {name:'tax', input_type:'list', type:'price', tab:'sidebar'},
            {name:'vat', input_type:'list', type:'vat', tab:'sidebar'},

            // {name:'cost_price', input_type:'list', type:'price', tab:'sidebar', class:'mt-1'},
            // {name:'markup', label:'Markup', input_type:'list', type:'price', tab:'sidebar'},
            {name:'profit', label:'Profit', input_type:'list', type:'price', tab:'sidebar', class:'mt-1', show:'record.cost_price'},
            
            {name:'margin', label:'Margin', input_type:'list', type:'percentage', tab:'sidebar', show:'record.cost_price'},

            {name:'sub_total', input_type:'list', type:'price', tab:'sidebar', class:'mt-1'},
            {name:'profit_total', input_type:'list', type:'price', tab:'sidebar'},
            {name:'tax_total', input_type:'list', type:'price', tab:'sidebar'},
            {name:'total', input_type:'list', class:'heading', type:'price', tab:'sidebar', style:'margin-top: 1rem'}

        ]

        this.routes = {
            administrators: Settings.permissions.groups.administrators
        }

    }

    async preSave(){

        await super.preSave()

        return new Promise( async (resolve, reject) => {

            if (this.data._parent_id){
                let invoice = await DB.read('invoices').where(['_id == '+this.data._parent_id]).show(['_id','_locked']).first()

                if (invoice && invoice._locked && invoice._locked === true){
                    reject('Unable to attach this item as the invoice you are linking to is locked')
                    return
                }
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

    async postTransaction(invoice){

        if (this.data.recurrence){

            if (!this.data.transactions){
                this.data.transactions = []
            }
            this.data.transactions.push({_id: transaction._id, reference: transaction.reference, paid: transaction._created})
            this.addTimestamp('paid')
    
            this.data._parent_id = null
            await this.save()

        } else {
            await this.delete()
        }

        return true

    }

    async makeInvoiceItems(recipient, invoice, start_date){

        recipient = JSON.parse(JSON.stringify(recipient))
        delete recipient.users

        if (!invoice.data.start_date){
            invoice.data.start_date = moment().tz('Europe/London').startOf('month').toISOString()
        }

        if (!invoice.data.end_date){
            invoice.data.end_date = moment().tz('Europe/London').endOf('month').toISOString()
        }

        let chargeable_items = [],
            single_items = [],
            recurring_chargeable_items = await DB.read('chargeable_items').where(['_parent == '+recipient._id, 'recurrence has value', 'price_id has value', 'invoice_id != '+invoice.data._id]).get(),
            prices = await new OrganisationPrices().all(),
            services = await new OrganisationServices().all()

        chargeable_items = await DB.read('chargeable_items').where(['_parent == '+recipient._id, 'recurrence has no value', 'price_id has value', 'start_date <= '+invoice.data.end_date, 'end_date >= '+invoice.data.start_date, 'timestamps.paid has no value', 'invoice_id != '+invoice.data._id]).get()
        single_items = await DB.read('chargeable_items').where(['_parent == '+recipient._id, 'recurrence has no value', 'price_id has value', 'recurrence has no value', 'invoice_id has no value', 'start_date has no value', 'end_date has no value','timestamps.paid has no value']).get()
        
        chargeable_items = chargeable_items.concat(recurring_chargeable_items, single_items)

        chargeable_items = view.removeDuplicates(chargeable_items)

        for (var item of chargeable_items){

            let span = 1

            if (item.recurrence && /day|week|month|year/.test(item.recurrence)){
                span = moment(invoice.data.end_date).diff(moment(invoice.data.start_date), item.recurrence)
                span++
            }

            let user = {
                name: item.name
            }

            if (!start_date){
                start_date = invoice.data.start_date
            }

            let chk = await this.checkrecurrence(item,start_date)

            if (!item.start_date){
                item.start_date = start_date
            }
          
            if (chk){

                if (item._user_id){
                    let user_class = item._user_id.split('/')[0]
                    user = await DB.read('users').where(['_id == '+item._user_id]).show(['_id','_key','_parent','name','email','tel','dob','discounts','initial_booking','gender','_created']).first()
                
                    if (user && user._id){
                   
                    } else {
                        user = {
                            name: item.name
                        }
                    }
                }

                let post_name = ''

                if (item._parent && /client_groups/.test(item._parent)){
                    let group = await DB.read('client_groups').where(['_id == '+item._parent]).show(['_id','name']).first()
                    if (group){
                        post_name = ' '+group.name
                    }
                    
                }

                let invoice_item = await this.makeInvoiceItem(user.name+post_name, item.price_id, prices.data, item.service_id, services.data, item.duration, item.start_date)
                invoice_item.chargeable_item = item._id
                invoice_item.additional_data = user && user._id ? user : recipient

                if (Array.isArray(item.transactions)){
                    invoice_item.additional_data.recurrences = item.transactions.length
                }
                
       
                if (span > 1){
                    invoice_item.quantity = span
                }

                await invoice.addItem(invoice_item)
            }
            
        }

        return []

    }

    async generateInvoices(data){

        if (!data){
            data = {}
        }

        if (!data.start_date){
            data.start_date = moment().startOf('month').toISOString()
        } else {
            data.start_date = new Date(data.start_date).toISOString()
        }

        if (!data.end_date){
            data.end_date = moment().endOf('month').toISOString()
        } else {
            data.end_date = new Date(data.end_date).toISOString()
        }

        let chargeable_items = [],
            single_items = [],
            invoices = [],
            now = moment().toISOString(),
            recurring_chargeable_items = await DB.read('chargeable_items').where(['recurrence has value', 'price_id has value','start_date <= '+now, 'end_date >= '+now]).get(),
            prices = await new OrganisationPrices().all(),
            services = await new OrganisationServices().all()

        chargeable_items = await DB.read('chargeable_items').where(['recurrence has no value', 'price_id has value', 'start_date <= '+data.end_date, 'end_date >= '+data.start_date]).get()
        single_items = await DB.read('chargeable_items').where(['recurrence has no value', 'price_id has value', 'invoice_id has no value', 'start_date has no value', 'end_date has no value','timestamps.paid has no value']).get()
       
        chargeable_items = chargeable_items.concat(recurring_chargeable_items, single_items)
       
        chargeable_items = view.removeDuplicates(chargeable_items)

        for (var item of chargeable_items){

            if (data.account_id && !item._account_id || data.account_id && item._account_id != data.account_id){
                continue
            }

            let chk = await this.checkrecurrence(item,data.start_date,data.end_date),
                existing_invoice = false,
                invoice = {},
                user = {
                    name: item.name
                },
                invoice_payload = {},
                span = 1

            if (item._parent && /^client_accounts/.test(item._parent) && !item._account_id){
                item._account_id = item._parent
            }

            if (!data.force_new_invoices && item._account_id){
                existing_invoice = await DB.read('invoice').where(['_parent == '+item._account_id, 'status == pending']).show(['_id','gocardless','start_date','end_date']).orderBy('_created','DESC').limit(1).first()
            }

            if (item._user_id){
                
                user = await DB.read('users').where(['_id == '+item._user_id]).show(['_id','_key','_parent','name','email','tel','dob','discounts','initial_booking','gender','_created']).first()
  
                if (user && user._id){
                
                    

                } else {
                    user = {
                        name: item.name
                    }
                }
            }
      
            if (item.recurrence && /day|week|month|year/.test(item.recurrence)){
                span = moment(data.end_date).diff(moment(data.start_date), item.recurrence)
                span++
            }
  
            if (existing_invoice && existing_invoice._id){
                invoice = await new Invoice().find(existing_invoice._id)
            } else {
           
                if (!item._account_id){
                    continue
                }

                let account_class = item._account_id.split('/')[0],
                account = await DB.read(account_class).where(['_id == '+item._account_id]).show(['_id','_key','_parent_id','name','email','tel','_created']).first(),
                account_owner = account

                if (account._id){

                    if (account._parent_id){
                        account_owner = await DB.read('users').where(['_id == '+account._parent_id]).show(['_id','_key','_parent','name','email','tel','_created']).first()
                    }

                } else {
                    continue
                }

                invoice_payload = {
                    _user_id: account_owner._id,
                    _parent: item._account_id,
                    billing_address: account.billing_address,
                    shipping_address: account.shipping_address,
                    items:[],
                    start_date: data.start_date,
                    end_date: data.end_date,
                    date_range:{},
                    subject: data.invoice_subject ? data.invoice_subject : '',
                    invoice_checked: false,
                    source:'ChargeableItems',
                    customer:{
                        _id: account_owner._id,
                        _parent_id: account._parent_id,
                        name: account_owner.name,
                        tel: account_owner.tel,
                        email: account_owner.email,
                        _created: account_owner._created
                    }
                }

                invoice = await new Invoice(invoice_payload)

            //    invoices.push({_id: invoice.data._id, _parent: item._parent})

            }
          
            if (!invoice.found()){
                continue
            }
            
            if (item.member){
                user.name = item.member
            }
            
            if (!item.start_date){
                item.start_date = data.start_date
            }

            if (chk){

                let post_name = ''

                if (item._parent && /client_groups/.test(item._parent)){
                    let group = await DB.read('client_groups').where(['_id == '+item._parent]).show(['_id','name']).first()
                    if (group){
                        post_name = ' '+group.name
                    }
                    
                }
      
                let invoice_item = await this.makeInvoiceItem(user.name+post_name, item.price_id, prices.data, item.service_id, services.data, item.duration, item.start_date)
                invoice_item._user_id = user._id
                invoice_item.chargeable_item = item._id
                invoice_item.additional_data = user

                if (user.discounts && user.discounts.length > 0){
                    if (isSet(config, 'invoice','stack_discounts') && config.invoice.stack_discounts === true){
                        invoice_item.discounts = user.discounts.concat(invoice_item.discounts)
                    } else {
                        invoice_item.discounts = user.discounts
                    }
                }
                
                if (item.transactions){
                    invoice_item.additional_data.recurrences = item.transactions.length
                } else {
                    invoice_item.additional_data.recurrences = 0
                }
 
                if (span > 1){
                    invoice_item.quantity = span
                }
           
                await invoice.addItem(invoice_item)
                let inv = await invoice.save()
         
            }
            
        }

        return []

    }

    async checkrecurrence(item, start_date, end_date){

        if (item.recurrence && item.recurrence == 'on_demand'){ // just do it
            return true
        }
 
        if (item.invoice_id){
            let invoice = await DB.read('invoice').where(['_id == '+item.invoice_id, 'start_date >= '+start_date, 'end_date <= '+end_date]).first()
            if (invoice && invoice._id){
                return false
            } else {
             //   return true
            }
        }

        let last_invoiced = item.timestamps && item.timestamps.invoiced ? moment(item.timestamps.invoiced) : false
        
        start_date = moment(start_date).tz('Europe/London')
 
        if (item.recurrence){
    
            if (last_invoiced === false){
                
                return true
            }

            return start_date.isAfter(last_invoiced) && !start_date.isSame(last_invoiced, item.recurrence)

        } else {
            return true
        }

    }

    async findByUser(data){

        let filter = []

        if (typeof data == 'object'){

            filter.push('_user_id == '+data._user_id)

            if (data._link){
                filter.push('_link == '+data._link)
            }

            if (data.service_id){
                filter.push('service_id == '+data.service_id)
            }

            if (data.price_id){
                filter.push('price_id == '+data.price_id)
            }

        } else if (typeof data == 'string'){
            filter.push('_user_id == '+data)
        } else {
            this.error = 'Not enough data to locate a related chargeable item'
            return this
        }
        
        this.data = await DB.read(this.settings.collection).where(filter).first()
        return this

    }

    async resetInvoiceKeys(keys){

        keys = keys.split(',')
        for (var key of keys){
            await DB.read(this.settings.collection).where(['invoice_id == invoice/'+key]).update({invoice_id: null, timestamps: {invoiced:null}}).new()
        }
        return keys

    }

    async resetInvoiceKey(key){

        await DB.read(this.settings.collection).where(['invoice_id == invoice/'+key]).update({invoice_id: null, timestamps: {invoiced:null}}).new()
        return key

    }


}

export default InvoiceItems