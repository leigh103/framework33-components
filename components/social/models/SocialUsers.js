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
            {name:"account_type", input_type:"hidden", options: this.account_types, type:"string", required: true},
            {name:"active", input_type:"checkbox", type:"boolean"},
            {name:'description', type:'string', input_type:'textarea', tab:'About you'},
            {name:'address', label:'Location', type:'object', input_type:'object',modal_hide: true,  required:false, tab:'About you', subitems:[
                // {name:'address_line1',input_type:'text',label:'Address Line 1', type:'string', required:false},
                // {name:'address_line2',input_type:'text',label:'Address Line 2', type:'string', required:false},
                // {name:'address_level2',input_type:'text',label:'City', type:'string', required:false},
                // {name:'address_level1',input_type:'text',label:'County', type:'string', required:false},
                
                {name:'postal_code',input_type:'text',label:'Post Code', type:'postcode', required:false}
            ]},
            {name:'gallery',tab:'gallery', input_type:'image',type:'object_array'},
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

        let follow_permission = {
            "model":"SocialUsers",
            "method":"follow",
            "ownershipFilter":false,
            "name":"SocialUsers follow permisions",
            "groups":["SocialUsers"]
        }

        existing = await DB.read('permissions').where(['name == SocialUsers follow permisions']).first()
        if (existing && existing._id){

        } else {
            await DB.create('permissions',follow_permission)
        }

        let subscribe_permission = {
            "model":"SocialUsers",
            "method":"subscribe",
            "ownershipFilter":false,
            "name":"SocialUsers subscribe permisions",
            "groups":["SocialUsers"]
        }

        existing = await DB.read('permissions').where(['name == SocialUsers subscribe permisions']).first()
        if (existing && existing._id){

        } else {
            await DB.create('permissions',subscribe_permission)
        }

    }

    async getGallery(data, req){

        return this.data.gallery

    }

    // --- Follows ---

    async follow(data, req) {

        let existing = await DB.read('social_follows')
            .where(['follower_id == ' + req.session.user._id, 'following_id == ' + data._id])
            .first()

        if (existing && existing._id) {
            this.data = await DB.read('social_follows')
                .where(['follower_id == ' + req.session.user._id, 'following_id == ' + data._id])
                .delete()

            return this
        }

        this.data = await DB.create('social_follows', {
            follower_id: req.session.user._id,
            follower_username: req.session.user.username,
            following_id: data._id,
            following_username: '',
            status: 'active'
        })

        return this
    }

    async unfollow(data, req) {
        this.data = await DB.read('social_follows')
            .where(['follower_id == ' + req.session.user._id, 'following_id == ' + data._id])
            .delete()

        return this
    }

    async getFollowers(data, req) {
        let user_id = this.data._id
        this.data = await DB.read('social_follows')
            .where(['following_id == ' + user_id, 'status == active'])
            .get()
        return this
    }

    async getFollowing(data, req) {
        let user_id = this.data._id
        this.data = await DB.read('social_follows')
            .where(['follower_id == ' + user_id, 'status == active'])
            .get()
        return this
    }

    async getFriends(data, req) {
        let user_id = this.data._id
        this.data = await DB.queryStr(`
            FOR f IN social_follows
            FILTER f.follower_id == '${user_id}' AND f.status == 'active'
            LET reverse = FIRST(
                FOR r IN social_follows
                FILTER r.follower_id == f.following_id AND r.following_id == '${user_id}' AND r.status == 'active'
                RETURN r
            )
            FILTER reverse != null
            RETURN f
        `)
        return this
    }

    async isFollowing(data, req) {

        let result = await DB.read('social_follows')
            .where(['follower_id == ' + req.session.user._id, 'following_id == ' + this.data._id, 'status == active'])
            .where(['follower_id == ' + this.data._id, 'following_id == ' + req.session.user._id, 'status == active'])
            .first()

        return typeof result?._id != 'undefined'
     //   return this
    }

    // --- Subscriptions ---

    async subscribe(data, req) {
        let existing = await DB.read('social_subscriptions')
            .where(['subscriber_id == ' + req.session.user._id, 'provider_id == ' + this.data._id])
            .first()

        if (existing && existing._id) {
            return this
        }

        await DB.create('social_subscriptions', {
            subscriber_id: req.session.user._id,
            subscriber_username: req.session.user.username,
            provider_id: this.data._id,
            provider_username: this.data.username,
            type: data.type || 'friend',
            status: data.status || 'active',
            plan_id: data.plan_id || null,
            current_period_start: data.current_period_start || null,
            current_period_end: data.current_period_end || null,
            payment_provider: data.payment_provider || null,
            payment_ref: data.payment_ref || null
        })

        return this
    }

    async cancelSubscription(data, req) {
        await DB.read('social_subscriptions')
            .where(['subscriber_id == ' + req.session.user._id, 'provider_id == ' + this.data._id])
            .update({status: 'cancelled'})
        return this
    }

    async getSubscribers(data, req) {
        let user_id = this.data._id
        this.data = await DB.read('social_subscriptions')
            .where(['provider_id == ' + user_id, 'status == active'])
            .get()
        return this
    }

    async getSubscriptions(data, req) {
        let user_id = this.data._id
        this.data = await DB.read('social_subscriptions')
            .where(['subscriber_id == ' + user_id, 'status == active'])
            .get()
        return this
    }

    async getPaidSubscribers(data, req) {
        let user_id = this.data._id
        this.data = await DB.read('social_subscriptions')
            .where(['provider_id == ' + user_id, 'type == paid', 'status == active'])
            .get()
        return this
    }

    async getFriendConnections(data, req) {
        let user_id = this.data._id
        this.data = await DB.read('social_subscriptions')
            .where(['provider_id == ' + user_id, 'type == friend', 'status == active'])
            .get()
        return this
    }

    async hasActiveSubscription(data, req) {
        let sub = await DB.read('social_subscriptions')
            .where(['subscriber_id == ' + req.session.user._id, 'provider_id == ' + this.data._id, 'status == active'])
            .first()
        this.data = {has_subscription: !!(sub && sub._id)}
        return this
    }

}

export default SocialUsers