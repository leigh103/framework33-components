import CalendarItems from '../../../core/models/CalendarItems.js'

class Lessons extends CalendarItems {

    constructor(data){

        super(data)

        this.settings = {
            collection: 'lessons',
            view:'calendar',
            header_field: 'name',
            show_fields:['name', 'staff','start_date','start_time','end_time','duration','start_dates','end_dates'],
            sort: {field: 'start_date',dir: 'ASC'},
            search_fields:['start_date','name'],
            no_joins: true
        }

        this.recurrence_intervals = [
            {text:'Day', value:'days'},
            {text:'Day (ex. weekends)', value:'weekday'},
            {text:'Day (ex. weekdays)', value:'weekend'},
            {text:'Week', value:'weeks'},
            {text:'Fortnight', value:'fortnight'},
            {text:'Month', value:'months'}
        ]

        this.recurrence_numbers = [
            {text:'1', value:'1'},
            {text:'2', value:'2'},
            {text:'3', value:'3'}
        ]

        this.joins = [
            {to:'_parent_id', collection:'lesson_sessions', return:'students', show:['_id','name','start_date','start_time','end_time','duration'], sort:'start_date'},
        ]

        this.array_joins = [
            {from: 'staff', return: 'staff', show: ['_id', 'name', 'role']}
        ]

        this.fields.push(

            {name:'staff',tab:'staff', input_type:'object_array', type:'object_array', subitems:[
                {name:'_id',label:'Staff Member', input_type:'parent', collection:'lesson_staff', type:'string',value_field: '_id'},
                {name:'name', input_type:'text', table_link:true}
            ]},
            {name:'students',tab:'students', input_type:'object_array', subitems:[
                {name:'name', input_type:'text', table_link:true},
                {name:'start_time', input_type:'text', table_show:true},
                {name:'duration', input_type:'text', table_show:true}
            ]}

        )

        // this.filters = [
        //     {name:''}
        // ]

    }

    async find(key, req){

        await super.find(key, req)

        if (this.data.students && this.data.students.length > 0){

            this.data.students = this.data.students.map((student)=>{

                student._id += '?date='+this.data.start_date
                return student

            })

        }

        return this

    }

    async all(data, req){

        await super.all(data, req)

        for (var lesson of this.data){

            if (lesson.staff && lesson.staff.length > 0){
                lesson.staff = lesson.staff.map(stff => stff.name)
                lesson.staff = lesson.staff.join(',')
            }

        }

        return this

    }


}

export default Lessons
