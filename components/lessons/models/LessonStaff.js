import Users from '../../../core/models/Users.js'

class LessonStaff extends Users {

    constructor(data) {
        super(data)

        this.settings = {
            collection: 'lesson_staff',
            view: 'users',
            show_fields: ['_id', 'thumbnail', 'name', 'email', 'tel', '_created'],
            search_fields: ['name', 'tel', 'ssn']  // Removed 'email' since it's encrypted
        }

        this.fields.push(
            { name: 'role', label: 'Role', input_type: 'text', type: 'string'}
        )

    }

}

export default LessonStaff