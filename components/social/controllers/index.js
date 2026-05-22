import SocialUsers from "../models/SocialUsers.js"
import { renderMenu } from '../../../core/models/Menus.js'
import WebPageLayouts from "../../../core/models/WebPageLayouts.js"


    Routes.get('account', async (req, res)=>{

        if (req.session?.user?._id){

            let data = {
                user: res.locals.user,
                model: new SocialUsers()
            }

            data.unread = await data.model.unread(false, req)

            data.record = await data.model.find(req.session.user._id)

            if (data.record.found()){
                data.record = data.record.get()
                data.fields = await data.model.parseEditFields(res.locals.user)

                // for (var tab in data.fields){

                //     data.fields[tab] = data.fields[tab].map((field)=>{

                //         if (field.input_type == 'image'){
                //             field.basic = true
                //         }

                //         return field

                //     })
                    
                // }

                let layout_data = {
                    view: '/components/social/views',
                    page:'account',
                    scripts:'scripts/public/account',
                    layout:'social'
                }

                let html = await renderPage(layout_data, data)
                res.send(html)

            } else {
                res.redirect('/login')
            }
            

        } else {
            res.redirect('/login')
        }
        
    })

    Routes.get('account/posts',':key?', async (req, res)=>{

        if (req.session?.user?._id){

            if (req.params.key){

                let data = {
                    user: res.locals.user,
                    model: new SocialPosts(),
                    record: {_key: 'new'}
                }

                if (req.params.key){
                    data.record = await data.model.find(req.params.key)
                    if (data.record.found()){
                        data.record = data.record.get()
                    }
                }
                
                data.fields = await data.model.parseEditFields(res.locals.user)

                for (var tab in data.fields){

                    data.fields[tab] = data.fields[tab].map((field)=>{

                        if (field.input_type == 'image'){
                            field.basic = true
                        }

                        return field

                    })
                    
                }

                let layout_data = {
                    view: '/components/social/views',
                    page:'add_post',
                    scripts:'scripts/public/add_post',
                    layout:'social'
                }

                let html = await renderPage(layout_data, data)
                res.send(html)

            } else {

                let data = {
                    user: res.locals.user
                }

                let layout_data = {
                    view: '/components/social/views',
                    page:'posts',
                    scripts:'scripts/public/posts',
                    layout:'social'
                }

                let html = await renderPage(layout_data, data)
                res.send(html)

            }

            

        } else {
            res.redirect('/login')
        }
            
        
    })


    Routes.get('profiles',':filter?', setTheme('/components/social/views', 'public'), async (req, res)=>{

        let data = {
            user: req.session?.user || {}
        }

        let filter = ['account_type == provider', 'active == true']
        if (req.query){
            filter = filter.concat(view.parseQuery(req.query))
        }

        if (req.params.filter == 'near-me' && data.user?.geo){

            // do geo lookup

        }

        data.profiles = await DB.read('social_users').where(filter).show(['username','avatar','background','dob','gender']).get()

        let layout_data = {
            view: '/components/social/views',
            page:'profiles',
            scripts:'scripts/public/default',
            layout:'social'
        }

        let html = await renderPage(layout_data, data)
        res.send(html)

    })


    Routes.get('profile',':key',setTheme('/components/social/views', 'public'), async (req, res)=>{

        let data = {
            user: req.session.user,
            model: new SocialUsers()
        }

        await data.model.find(['username == '+req.params.key])

        if (data.model.found()){

            await data.model.sanitize()
            data.record = data.model.get()

            data.isFollowing = await data.model.isFollowing({}, req)

            let layout_data = {
                view: '/components/social/views',
                page:'profile',
                scripts:'scripts/public/profile',
                layout:'social'
            }

            let html = await renderPage(layout_data, data)
            res.send(html)
            
        } else {
            res.redirect('/404')
        }

    })

    Routes.get('profile',':key/gallery',setTheme('/components/social/views', 'public'), async (req, res)=>{

        let data = {
            user: req.session.user,
            model: new SocialUsers()
        }

        await data.model.find(['username == '+req.params.key])

        if (data.model.found()){

            await data.model.sanitize()
            
            data.gallery = await data.model.getGallery({}, req)

            data.isFollowing = await data.model.isFollowing({}, req)

            let layout_data = {
                view: '/components/social/views',
                page:'profile_gallery',
            //    scripts:'scripts/public/profile_gallery',
                layout:'social'
            }

            let html = await renderPage(layout_data, data)
            res.send(html)
            
        } else {
            res.redirect('/404')
        }

    })


    Routes.get('account/messages', async (req, res)=>{

        if (req.session?.user?._id){

            let data = {
                user: req.session.user
            }

            data.model = new Notification()

            data.records = await new Users().mailbox({start:0, records_per_page:100}, req)
            data.total_records = data.records._count
            data.records = data.records.get()
    
            data.fields = await data.model.parseEditFields(res.locals.user)

            let layout_data = {
                view: '/components/social/views',
                page:'messages',
                scripts:'scripts/public/messages',
                layout:'social'
            }

            let html = await renderPage(layout_data, data)
            res.send(html)

        } else {
            res.redirect('/login')
        }

    })

    Routes.get('sign-up',setTheme('/components/social/views', 'public'), async (req, res)=>{

        if (req.session?.user?._id){
        
            res.redirect('/account')

        } else {

            let data = {
                user: req.session.user
            }

            let layout_data = {
                view: '/components/social/views',
                page:'signup',
                scripts:'scripts/public/signup',
                layout:'social'
            }

            let html = await renderPage(layout_data, data)
            res.send(html)
        }

    })

    Routes.post('sign-up',setTheme('/components/social/views', 'public'), async (req, res)=>{

        if (isSet(req,'session','bot') && req.session.bot === true){
            return res.status(404).send('Bot protection activated')
        }

        if (req.session?.user?._id){
        
            res.redirect('/account')

        } else {

            let existing = await DB.read('social_users').where(['username.toLowerCase == '+req.body.username.toLowerCase()]).show(['_id']).first()

            if (existing && existing._id){
                return res.status(401).send("That username isn't available, please chose another")
            } else {

                let payload = {
                    username: req.body.username,
                    email: req.body.email,
                    password: req.body.password,
                    account_type: req.body.account_type,
                    gender: req.body.gender,
                    dob: req.body.dob
                }

                let password_payload = {
                    password: req.body.password,
                    password_confirmation: req.body.password_confirmation
                }

                let password = await new Users().passwordValidation(password_payload)

                if (password.error){
                    return res.status(401).send(password.error)
                }

                let new_user = await new SocialUsers(payload).save()

                if (new_user.error){
                    return res.status(500).send(new_user.error)
                }

                return res.redirect("/login")
            }
            
            
        }

    })

    const init = async () => {

        let existing_layout = await DB.read('web_page_layouts').where(['name == social']).first()

        if (existing_layout && existing_layout._id){

        } else {

            let payload = {
                name: 'social',
                header:`<head>
  <link href="/style/boxicons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/style/framework-33/v3.0/framework33.css">
  <link rel="stylesheet" href="/style/basic.css">
</head>`,
                styling:'',
                nav:'social',
                nav_classes:'horizontal',
                footer:`<footer>
  <div class="contain flex">

  </div>
</footer>
<script src="/js/framework-33/v3.0/framework33.js?v=3"></script>
<!-- scripts -->
<script src="/js/framework-33/v3.0/functions.js?v=3"></script>
<script src="/js/framework-33/v3.0/controller.js?v=3"></script>`
            }

            await DB.create('web_page_layouts', payload)

        }

    }

    init()