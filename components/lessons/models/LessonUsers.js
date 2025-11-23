import Users from '../../../core/models/Users.js'

class LessonUsers extends Users {

    constructor(data) {
        super(data)

        this.settings = {
            collection: 'lesson_users',
            view: 'users',
            show_fields: ['_id', 'thumbnail', 'name', 'email', 'tel', '_created'],
            search_fields: ['name', 'tel', 'ssn']  // Removed 'email' since it's encrypted
        }

        this.fields.push(
            { name: 'user_type', label: 'Parent, student or adult learner', input_type: 'select', type: 'string', options:[
                {text:'Parent', value:'parent'},
                {text:'Student', value:'student'},
                {text:'Adult Student', value:'adult_student'}
            ]}
        )

        this.label = "Parents and Students"

    }

}

export default LessonUsers