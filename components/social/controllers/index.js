    
 

    Routes.get('account',setTheme('/components/social/views', 'public'), async (req, res)=>{

        if (req.session?.user?._id){

            let layout = await DB.read('web_page_layouts').where(['name == social']).first()

            let data = {
                user: req.session.user,
                header: layout.header,
                footer: layout.footer,
                model: new SocialUsers()
            }

            data.record = await data.model.find(req.session.user._id)

            if (data.record.found()){
                data.record = data.record.get()
                data.fields = await data.model.parseEditFields(res.locals.user)

                for (var key in data.fields){

                    data.fields[key] = data.fields[key].map((field)=>{

                        if (field.input_type == 'image'){
                            field.basic = true
                        }

                        return field

                    })
                    
                }

                res.render('account.ejs', data)
            } else {
                res.redirect('/login')
            }
            

        } else {
            res.redirect('/login')
        }
        
    })

    Routes.get('profiles',':filter?', setTheme('/components/social/views', 'public'), async (req, res)=>{

        let layout = await DB.read('web_page_layouts').where(['name == social']).first()

        let data = {
            user: req.session?.user || {},
            header: layout.header,
            footer: layout.footer
        }

        let filter = ['account_type == provider']
        if (req.query){
            filter = filter.concat(view.parseQuery(req.query))
        }

        if (req.params.filter == 'near-me' && data.user?.geo){

            // do geo lookup

        }

        data.profiles = await DB.read('social_users').where(filter).show(['username','avatar','dob','gender']).get()

        res.render('profiles.ejs', data)

    })


    Routes.get('profile',':key',setTheme('/components/social/views', 'public'), async (req, res)=>{

        let layout = await DB.read('web_page_layouts').where(['name == social']).first()

        let data = {
            user: req.session.user,
            header: layout.header,
            footer: layout.footer,
            model: new SocialUsers()
        }

        await data.model.find(['username == '+req.params.key])

        if (data.model.found()){

            await data.model.sanitize()
            data.record = data.model.get()

            res.render('profile.ejs', data)
            
        } else {
            res.redirect('/404')
        }

        

    })


    Routes.get('messages',setTheme('/components/social/views', 'public'), async (req, res)=>{

        if (req.session?.user?._id){

            let layout = await DB.read('web_page_layouts').where(['name == social']).first()

            let data = {
                user: req.session.user,
                header: layout.header,
                footer: layout.footer
            }

            data.model = new Notification()

            data.records = await new Users().mailbox({start:0, records_per_page:100}, req)
            data.total_records = data.records._count
            data.records = data.records.get()
    
            data.fields = await data.model.parseEditFields(res.locals.user)

            res.render('messages.ejs', data)

        } else {
            res.redirect('/login')
        }

    })

    const init = async () => {

        let existing_layout = await DB.read('web_page_layouts').where(['name == social']).first()

        if (existing_layout && existing_layout._id){

        } else {

            let payload = {
                name: 'social',
                header:'',
                styling:'',
                footer:''
            }

            await DB.create('web_page_layouts', payload)

        }

    }

    init()