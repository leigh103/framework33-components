    
    const route = 'register'

    Routes.get(route, ':page?', setTheme('/components/lessons/views','public'), async (req, res)=>{

        if (req.session?.user){
            res.render('index.ejs')
        } else {
            res.render('index.ejs')
        }
        
    })

    Routes.get('dashboard','lesson-component', setTheme('/components/lessons/views','dashboard'), async (req, res)=>{

                    // "sub_items": [
            //     {
            //         "active": true,
            //         "icon": "calendar",
            //         "name": "Calendar",
            //         "weight": 0,
            //         "slug": "lessons/calendar"
            //     },

            //     {
            //         "active": true,
            //         "icon": "menu",
            //         "name": "Lessons",
            //         "weight": 1,
            //         "slug": "lessons/all"
            //     },
            //     {
            //         "active": true,
            //         "icon": "user",
            //         "name": "Students",
            //         "weight": 1,
            //         "slug": "lesson_users/all"
            //     },
            //     {
            //         "active": true,
            //         "icon": "user",
            //         "name": "Staff",
            //         "weight": 1,
            //         "slug": "lesson_staff/all"
            //     },
            //     {
            //         "active": true,
            //         "icon": "menu",
            //         "name": "Subjects",
            //         "weight": 2,
            //         "slug": "lesson_subjects/all"
            //     }
            // ]

        if (req.session?.user){
            res.render('dashboard-index.ejs')
        } else {
            res.render('dashboard-index.ejs')
        }
        
    })