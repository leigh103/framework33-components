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

    Routes.get('call', async (req, res) => {

        if (!req.session?.user?._id){
            return res.redirect('/login')
        }

        const roomId = Math.random().toString(36).slice(2, 10)
        res.redirect('/call/' + roomId)

    })

    Routes.get('call', ':roomId', async (req, res) => {

        // if (!req.session?.user?._id){
        //     return res.redirect('/login')
        // }

        let data = {
            user: res.locals.user,
            roomId: req.params.roomId
        }

        let layout_data = {
            view: '/components/social/views',
            page: 'call',
            scripts: 'scripts/public/call',
            layout: 'social'
        }

        let html = await renderPage(layout_data, data)
        res.send(html)

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
  <!-- meta -->
</head>`,
                styling:`@import url('https://fonts.googleapis.com/css2?family=Elms+Sans:ital,wght@0,100..900;1,100..900&display=swap');

:root {
    --color-primary: rgb(204, 22, 134);
    --color-primary-dark: rgb(78, 10, 52);
    --color-grey-1: #eee;
    --color-grey-2: #ddd;
    --color-grey-3: #aaa;
    --color-grey-4: #434749;
    --color-grey-5: #444;
    --page-bg: #1c1e1f;
    --text-color: white;
    --text-color-alt: #444;
    --border-radius: 1rem;
}

html, body {
    font-family:'Elms Sans';
    font-weight: 300;
}

h1 {
    font-size: 2rem;
}

h1, h2, h3 {
    font-weight: 400;
}

a {
    color: var(--color-primary);

}

.bg-grey-5 {
    background-color: var(--color-grey-5);
}

input, textarea, select {
  color: var(--text-color-alt);
}

.page {
  
  	position: relative;
    min-height: 90vh;
    background: var(--page-bg);
    color: var(--text-color);
  	padding: 1rem 0 2rem 0;

  h1 {
    margin-bottom: 2rem
  }
    &.hero {

        min-height: 50vh;
        display: flex;
        align-items: center;
        justify-content: flex-start;

        h1 {
            font-size: 5rem;
          margin-bottom: 0;
        }

      .background {
        height: 100%;
        opacity: 0.5;
      }
    }
}

label {
    color: var(--text-color);
}

footer {
    background: var(--color-primary-dark);
    min-height: 10vh;
    color: white;
    padding: 1rem 0;
}

.btn {
    background: var(--color-primary);
    color: white;

    &.bg-white {
        background: none;
        border: 3px solid var(--text-color);
        color: var(--text-color);
    }
  
  &.outline-primary {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

dialog.file-browser-dialog .file-browser-header {
  background-color: var(--color-primary-dark);
}
 
.modal {
    &> section {
        background-color: var(--color-primary-dark);
    }
}

.modal .bg-primary {
    background-color: var(--color-primary)
}

div[class^="input"] {
    margin-bottom: 1rem;
}

div.input-image {
    flex-direction: row;

    &[class*="field-record.avatar"] img{
        width: 20rem;
        height: 20rem;
        object-fit: cover;
        border-radius: var(--border-radius);
    }
}

nav {
  background: var(--page-bg);
}

.menu {
    display: block;
    a {
      display: block;
      width: 100%;
        margin-right: 1rem;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        &.active {
            background-color: var(--color-grey-4);
            color: var(--text-color);
        }
      
      @media (max-width: 851px){
        display: inline-block;
        width: auto;
        margin: 0;
      }
    }
}

.profiles {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1rem;

    .profile {
        position: relative;
        background: rgba(255,255,255,0.2);
        border-radius: var(--border-radius);
        padding: 1rem;
        grid-column-end: span 3;
        color: var(--text-color);
        background-size: cover;
        height: 20rem;

        .details {
            position: absolute;
            bottom: 1rem;
            left: 1rem;
            h2 {
                margin: 0.5rem 0 0 0;
                font-size: 1rem;
            }
        }
        

    }
}

.profile {
  
  .banner {
    max-height: 50vh;
    width: auto;
    
    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
  }
  
  &.gallery {
    .img-wrapper {
      position: relative;
      height: 100%;
      width: 100%;
      
      img {
        height: 100%;
        width: 100%;
        object-fit: cover;
        aspect-ratio: 1 / 1;
        border-radius: var(--border-radius);
      }
    }
  }
  
}

@media (max-width: 851px) {
    .profiles {

        grid-template-columns: repeat(6, 1fr);
    }
}

.counter {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 1rem;
    height: 1rem;
    font-size: 0.7rem;
    border-radius: 50%;
    background-color: red;
    color: white;
}

.messages {

    height: calc(100vh - 4rem);
  	overflow: hidden;

    #records {

        padding-right: 1rem;

        .record {
            display: flex;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
            margin: 0 0 0.5rem 0;
						overflow: hidden;
          
            a {
                font-size: 1rem;
                display: flex;
                align-items: center;
            }

            thumb-nail {
                margin-right: 1rem;
            }

            &.selected, &:hover {
                background-color: var(--color-grey-5);
            }

            &.unread {
                font-weight: 600;
                background-color: var(--color-primary-dark);
                
            }
        }

    }

    &+footer {
        display: none;
    }

}

@media (max-width: 851px) {
    .messages {

        .contain.flex {
            display: block;
        }

        #records.open {
            display: none;
        }
    }
}

.thread-wrapper {
    flex: 3;
    display: flex;
    flex-direction: column;
    padding: 0;
    height: calc(100% - 4rem);

    .new {
        align-items: center;
        padding: 1rem 0 3rem 0;
        width: 100%;
        color: var(--text-color-alt);

        input {
            min-height: 1rem;
            height: auto;
            padding: 0.75rem 1.2rem;
            background-color: white;
            border-radius: 2rem;
        }
    }
}

#thread {

    flex: 1;
    overflow-y: auto;

    &.records {

         .record {

            font-size: 0.9rem;
            margin-bottom: 0.5rem;

            & > .content {
                display: inline-block;
                padding: 1rem;
                border-radius: var(--border-radius);
                border-bottom-left-radius: 0;
                width: auto;
                background: white;
                color: var(--text-color-alt);

                & .details {
                    display: none;
                }

                
            }

            &.outgoing {
                text-align: right;

                & > .content {
                    border-radius: var(--border-radius);
                    border-bottom-right-radius: 0;
                    background-color: var(--color-primary);
                    color: var(--text-color);
                  a {
                    color: var(--text-color);
                  }
                }
            }


        }

    }

}

.feed {
  background: var(--color-grey-4);
  border-radius: var(--border-radius);
  padding: 2rem;
  
  .tabs {
  	margin-bottom: 2rem;
  }

  table {
    tbody td, th {
      padding: 0 0 0.5rem 0;
    }
    
    th {
      font-weight: 300;
      color: var(--color-grey-1);
    }
    
    td {
      font-weight: 500;
      color: var(--text-color);
    }
  }
  
  .gallery {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
    height: 10rem;
    
    img {
      display: inline-block;
      height: 10rem;
      width: 10rem;
      object-fit: cover;
      aspect-ratio: 1 / 1;
    }
  }
}

.post {
  
  margin: 1rem 0;
  .subject {
    font-weight: 500;
  }
  .date {
    font-size: 0.7rem;
  }
}

.page.call { 
  display: flex; flex-direction: column; padding: 0; 

  .call-main { flex: 1; display: flex; min-height: 0; }
  .videos-container { flex: 1; position: relative; background: #111; overflow: hidden; }
  .remote-videos { display: flex; flex-wrap: wrap; width: 100%; height: 100%; }
  .remote-videos video { flex: 1; min-width: 300px; object-fit: cover; background: #222; }
  .local-video-wrapper { position: absolute; bottom: 1rem; right: 1rem; width: 180px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,.6); border: 2px solid rgba(255,255,255,.15); }
  .local-video-wrapper video { width: 100%; display: block; }
  .call-header, .call-controls { background: #0d0d1a; }
  .call-controls .btn.round { width: 3rem; height: 3rem; font-size: 1.25rem; }
  .chat-panel { width: 280px; display: flex; flex-direction: column; background: #13131f; border-left: 1px solid rgba(255,255,255,.08); overfow-y:auto}
  .chat-messages { flex: 1; overflow-y: auto; padding: .75rem; display: block; }
  .chat-msg { display: inline-block; padding: .4rem .6rem; border-radius: 6px; width: 100%; font-size: .875rem; line-height: 1.4; }
  .chat-msg.mine { background: var(--color-primary); color:var(--text-color); text-align: right; }
  .chat-msg.theirs { background: #1e1e30; text-align: left; }
  .chat-msg .chat-name { font-size: .7rem; opacity: .6; margin-bottom: .15rem; }
  .chat-input-row { display: flex; gap: .5rem; padding: .75rem; border-top: 1px solid rgba(255,255,255,.08); }
  .chat-input-row input { flex: 1; background: #1e1e30; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; padding: .4rem .6rem; color: #fff; font-size: .875rem; }
  .chat-input-row input:focus { outline: none; border-color: rgba(255,255,255,.3); }
  
}

@media (max-width: 850px){
  
  .page.call {
    
    .call-main {
      flex-direction: column;
    }
    
    .chat-panel {
      width: 100%;
      height: 40vh;
    }
    
  }
  
}

`,
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