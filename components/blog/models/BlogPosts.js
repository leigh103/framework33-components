import Models from '../../../core/services/Models.js'

class BlogPosts extends Models {
    constructor(data) {
        super(data)
        
        this.settings = {
            collection: 'blog_posts',
            search_fields: ['name'],
            show_fields: ['thumbnail','name','slug','seo_description','_created']
        }

        this.fields = [
            {name: 'image', label:'Image',tab:'sidebar', input_type:'image', type: 'image', thumbnail: true},
            {name: 'name', label:'title', input_type:'text', type: 'string', required: true},
            {name: 'slug', label:'Post URL or Slug', input_type:'text', type: 'slug', required: true},
            {name: 'content', label:'content', input_type:'contenteditable', type: 'string', required: true},
            {name: 'seo_description', tab:'sidebar', label:'SEO Description', input_type:'textarea', type: 'string'},
            {name: 'published', tab:'sidebar', label:'Publish On', input_type:'datetime', type: 'date'}
        ]

    }

    async preSave(){

        if (!this.data.slug){
            this.data.slug = this.data.name
        }

        return this

    }

    async recent(data, req){

        let now = moment().tz('Europe/London').toISOString(),
            limit = req.query.limit || 3

        let articles = await DB.read(this.settings.collection).where(['published < '+now]).limit(limit).sort('_created','DESC').get()

        return articles

    }

    async public(page = 1){

        let now = moment().tz('Europe/London').toISOString(),
            per_page = 20,
            page_start = (page * per_page)-per_page

        let articles = await DB.read(this.settings.collection).where(['published < '+now]).limit(page_start, per_page).sort('_created','DESC').get(),
            count = await DB.read(this.settings.collection).length()

        return {articles:articles, count: count}

    }


}

export default BlogPosts