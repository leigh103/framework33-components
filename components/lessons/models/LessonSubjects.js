
import Models from '../../../core/services/Models.js'

class LessonSubjects extends Models {

    constructor(data){

        super(data)

        this.settings = {
            collection: 'lesson_subjects',
            show_fields:['name'],
            search_fields:['name']
        }

        this.fields = [
            {name:'name',input_type:'text', type:'string', required:true}
        ],

        this.routes = {
            administrators: Settings.permissions.groups.administrators
        }

    }


}

export default LessonSubjects