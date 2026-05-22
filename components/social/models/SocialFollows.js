import Models from '../../../core/services/Models.js'

class SocialFollows extends Models {
    constructor(data) {
        super(data)

        this.settings = {
            search_fields: ['follower_username', 'following_username'],
            show_fields: ['follower_username', 'following_username', 'status', '_created'],
            collection: 'social_follows'
        }

        this.statuses = [
            {text: 'Active', value: 'active'},
            {text: 'Pending', value: 'pending'},
            {text: 'Blocked', value: 'blocked'}
        ]

        this.fields = [
            {name: 'follower_id', type: 'string', input_type: 'hidden', required: true},
            {name: 'follower_username', type: 'string', input_type: 'disabled', required: true},
            {name: 'following_id', type: 'string', input_type: 'hidden', required: true},
            {name: 'following_username', type: 'string', input_type: 'disabled', required: true},
            {name: 'status', type: 'string', input_type: 'select', options: this.statuses, default: 'active'}
        ]
    }

}

export default SocialFollows
