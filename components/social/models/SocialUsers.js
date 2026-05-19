import Users from '../../../core/models/Users.js'

class SocialUsers extends Users {
    constructor(data) {
        super(data)
        
        // Add game-specific settings
        this.settings = {
            search_fields:['username','email','tel'],
            show_fields:['thumbnail', 'username','tel','email'],
            collection: 'social_users',
            view:'users',
            login: '/account'
        }

        this.account_types = [
            {text:'provider', value:'provider'},
            {text:'customer', value:'customer'}
        ]

        // Add game-specific fields
        this.fields = [
            {name:'avatar',tab:'images', input_type:'image',type:'image', thumbnail:true},
            {name:'background',tab:'images', input_type:'image',type:'image'},
            {name:'username',input_type:'text', table_link:true, type:'string', required:true},
            {name:'password',input_type:'hidden', type:'password', required:false},
            {name:'email',input_type:'email', type:'email', permission:'client_contacts', required:true, table_show:true, analyzers: ['identity']},
            {name:'tel',input_type:'text', type:'tel', permission:'client_contacts', required:false, style:'padding-bottom: 1em', table_show:true, analyzers: ['identity']},
            {name:"dob", label:'Date of birth', input_type:"date", type:"date", format:'Do MMMM YYYY', required:true},
            {name:"gender", input_type:"select", options: view.genders, type:"string", required:true, analyzers: ['identity']},
            {name:"account_type", input_type:"select", options: this.account_types, type:"string"},
            {name:'description', type:'string', input_type:'textarea', tab:'About you'},
             {name:'address', type:'object', input_type:'object',modal_hide: true,  required:false, tab:'address', subitems:[
                {name:'address_line1',input_type:'text',label:'Address Line 1', type:'string', required:false},
                {name:'address_line2',input_type:'text',label:'Address Line 2', type:'string', required:false},
                {name:'address_level2',input_type:'text',label:'City', type:'string', required:false},
                {name:'address_level1',input_type:'text',label:'County', type:'string', required:false},
                
                {name:'postal_code',input_type:'text',label:'Post Code', type:'postcode', required:false}
            ]},
            {name:'geo', type:'object', input_type:'hidden', required: false}
        ]


    }

    async init(){

        await super.init()

        let upload_permission = {
            "model":"Files",
            "method":"save",
            "ownershipFilter":true,
            "name":"SocialUsers upload permisions",
            "groups":["SocialUsers"]
        }

        let existing = await DB.read('permissions').where(['name == SocialUsers upload permisions']).first()
        if (existing && existing._id){

        } else {
            await DB.create('permissions',upload_permission)
        }

        let messaging_permission = {
            "model": "Notification",
            "method": "*",
            "groups": [
                "SocialUsers"
            ],
            "ownershipFilter": false,
            "name": "SocialUsers messaging permissions"
            }

        existing = await DB.read('permissions').where(['name == SocialUsers messaging permissions']).first()
        if (existing && existing._id){

        } else {
            await DB.create('permissions',messaging_permission)
        }



    }


}

export default SocialUsers