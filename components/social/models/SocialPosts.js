import Users from '../../../core/services/Models.js'

class SocialPosts extends Models {
    constructor(data) {
        super(data)

        this.settings = {
            search_fields:['subject','content'],
            show_fields:['username','subject','_created'],
            collection: 'social_posts'
        }

        this.access = [
            {text:'Anyone', value:'anyone'},
            {text:'Subscribers', value:'subscribers'},
            {text:'Hidden', value:'hidden'}
        ]

        this.joins = [
            {from:'_created_by', collection:'social_users', return:'username', show:['username']}
        ]

        this.fields = [
            // {name:'_parent', type:'string', input_type:'hidden', required:true},
            // {name:'username', type:'string', input_type:'disabled', required:true},
            {name:'subject', type:'string', input_type:'text', table_link: true, required:true},
            {name:'content', type:'string', input_type:'textarea', required:true},
            {name:'gallery',tab:'gallery', input_type:'image',type:'object_array'},
            {name:'access', type:'string', input_type:'select', options: this.access, default:'hidden'}
        ]

    }

    // async preSave(data, req){

    //     this.data._parent = req.session.user._id
    //     this.data.username = req.session.user.username
    //     return this

    // }

    async getPosts(data, req){

        let parent_id = data._parent,
            is_connected = false
        

        if (req && req.session && req.session.user && req.session.user._id === parent_id) {

            this.data = await DB.read(this.settings.collection).where(['_created_by == ' + parent_id,'access != hidden']).sort('_created','DESC').get()
            return this

        } else {

            if (req && req.session && req.session.user) {

                let follower = await DB.read('social_follows')
                    .where(['follower_id == ' + req.session.user._id, 'following_id == ' + parent_id, 'status == active'])
                    .first()

                if (follower && follower._id) {
                    is_connected = true
                } else {
                    let subscriber = await DB.read('social_subscriptions')
                        .where(['subscriber_id == ' + req.session.user._id, 'provider_id == ' + parent_id, 'status == active'])
                        .first()
                    is_connected = !!(subscriber && subscriber._id)
                }
            }

        }

        if (is_connected){
            this.data = await DB.read(this.settings.collection).where(['_created_by == ' + parent_id, 'access != hidden']).sort('_created','DESC').get()
        } else {    
            this.data = await DB.read(this.settings.collection).where(['_created_by == ' + parent_id,'access == anyone']).sort('_created','DESC').get()
        }

        return this

    }

    async init(){

        await super.init()

        let post_permission = {
            "model":"SocialPosts",
            "method":"getPosts",
            "ownershipFilter":false,
            "name":"SocialUsers post view permisions",
            "groups":["SocialUsers"]
        }

        let existing = await DB.read('permissions').where(['name == SocialUsers post view permisions']).first()
        if (!existing || !existing._id){
            await DB.create('permissions',post_permission)
        }

        post_permission = {
            "model":"SocialPosts",
            "method":"*",
            "ownershipFilter":true,
            "name":"SocialUsers post permisions",
            "groups":["SocialUsers"]
        }

        existing = await DB.read('permissions').where(['name == SocialUsers post permisions']).first()
        if (!existing || !existing._id){
            await DB.create('permissions',post_permission)
        }


    }


}

export default SocialPosts