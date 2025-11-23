    
    const route = 'blog'

    Routes.get(route, ':slug', setTheme('/components/blog/views', 'public'), async (req, res)=>{

        let article = await new BlogPosts().find(['slug == '+req.params.slug])
        if (article.found()){
            article.data.include_styles = ['styles/style.ejs']
            res.render('blog_post.ejs', article.data)
        } else {
            res.redirect('/404')
        }
        
    })


    Routes.get(route, setTheme('/components/blog/views', 'public'), async (req, res)=>{

        let page = req.query.page || 1

        let articles = await new BlogPosts().public(page)
        articles.include_styles = ['styles/style.ejs']
        res.render('index.ejs', articles)
        
    })