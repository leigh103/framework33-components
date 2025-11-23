import Prices from '../../../core/models/Prices.js'

class LessonSessions extends Prices {

    constructor(data){

        super(data)

        this.settings = {
            collection: 'lesson_sessions',
            view:'chargeable',
            show_fields:['name','start_date','start_time','end_time','duration', 'event', 'event_date', 'price'],
            search_fields:['name', 'event'],
            header_field:['name']
        }

        this.statuses = [
            {text:'Present', value: 'present'},
            {text:'Absent', value: 'absent'}
        ]

        this.types = [
            {text:'Participant', value: 'participant'},
            {text:'Host', value: 'host'}
        ]

        this.durations = function(interval = 5, maxDuration = 60) {
            let durations = []
            for (let i = interval; i <= maxDuration; i += interval) {
                durations.push(i)
            }
            return durations
        }

        this.joins = [
            {from:'_parent_id', collection:'lessons', return:'_parent', first:true, show:['_id','name','_link', '_location_id','start_date','end_date','start_dates','end_dates']},
            {from:'_user_id', collection:'lesson_students', return:'_user', first:true, show:['_id','name', 'tel','email']},
            {from:'_attendance_taken_id', collection:'lesson_staff', return:'_attendance_taken', first:true, show:['_id','name', 'tel','email']},
            {from:'_price_id', collection:'prices', return:'_price', first:true},
        ]

        this.fields = [

            {name:'_parent_id', label:'Event', tab:'sidebar', input_type:'parent', collection:'lessons', type:'string',value_field: '_id', text_field:'name'},
            {name:'_user_id',label:'Select registered user', input_type:'parent', collection:'lesson_users', fields:['name', 'tel', 'email'], type:'string',value_field: '_id'},
            {name:'_user',input_type:'object', type:'object', subitems:[
                {name:'name', input_type:'text', type:'string'},
                {name:'tel', input_type:'text', type:'tel'},
                {name:'email', input_type:'email', type:'email'}
            ]},
        //    {name:'type', input_type:'radio', options: this.types, type:'string'},
            {name:'_parent',input_type:'object', tab:'sidebar', subitems:[
                {name:'start_date', label: 'Date', input_type:'list', type:'date', format:'Do MMMM YYYY'},

            ]},
            {name:'name', input_type:'text', type:'string', table_link:true, show:'record.xxx'},

            {name:'start_time_obj', label:'Time', tab: 'sidebar', input_type:'time', type:'object', show:'record._parent.start_date'},
            {name:'duration', tab: 'sidebar',input_type:'select', type:'number', options: this.durations(5, 60), show:'record._parent.start_date'},
            {name:'start_date', tab: 'sidebar', input_type:'datetime', type:'date', hide:'record._parent.start_date'},
            {name:'end_date', tab: 'sidebar', input_type:'datetime', type:'date', hide:'record._parent.start_date'},
            {name:'_price_id', tab: 'price', tab: 'sidebar',label:'Set a price',input_type:'parent', collection:'prices', type:'string',value_field: '_id', text_field:'name'},
       
            {name:'sub_total', input_type:'list', type:'price', tab:'sidebar', class:'mt-1', show:'record._price'},
            {name:'tax', input_type:'list', type:'price', tab:'sidebar', show:'record._price'},
            {name:'total', input_type:'list', class:'heading', type:'price', tab:'sidebar', style:'margin-top: 1rem', show:'record._price'},

//            {name:'_location_id', input_type:'hidden', option_data:'locations', type:'string',value_field: '_id', text_field:'name'},
            {name:'_invoice_id', label:'Invoice', tab:'sidebar', input_type:'parent', collection:'invoices', type:'string',value_field: '_id', text_field:'reference', show:'record._invoice_id'},
            

            {name:'paid', input_type:'list', tab:'sidebar', type:'date', show:'record._invoice_id'},

            {name:'attendance', tab: 'attendance', input_type:'select', options: this.statuses, type:'string', show:'record._user.name'},
            {name:'attendance_description', tab: 'attendance', input_type:'textarea', type:'string', show:'record.attendance'},
            
            {name:'_attendance_taken_id', tab:'attendance',label:'Attendance taken by', show:'record.attendance', input_type:'parent', collection:'users', type:'string',value_field: '_id'},
            {name:'attendance_taken', tab:'attendance', input_type:'disabled', type:'date', show:'record.attendance'},
        
        ]

        this.filters = [
            {name:'from',input_type:'datetime', type:'date', format:'ddd Do MMMM YYYY h:mma'},
            {name:'to',input_type:'datetime', type:'date', format:'ddd Do MMMM YYYY h:mma'},
        ]

        this.routes = {
            administrators: Settings.permissions.groups.administrators
        }

    }

    async find(key, req){

        await super.find(key, req)

        const clickedDate = req?.query?.date || req?.body?.date || req?.params?.date || false
        this.parseFields(false, clickedDate)

        return this

    }

    parseFields(record, date){

        if (record){
            this.data = record
        }

        if (this.data._parent?.start_dates){

            const matchingIndex = this.data._parent.start_dates.findIndex(startDate => {
                    const eventMoment = moment(startDate).tz('Europe/London')
                    return eventMoment.isSame(date, 'day')
                })
            
            if (matchingIndex !== -1) {
                this.data._parent.start_date = this.data._parent.start_dates[matchingIndex]
            }

        }

        if (this.data._parent?.start_date){

            let start_time = this.fields.find(fld => fld.name == 'start_time_obj'),
                start_date = moment(this.data._parent?.start_date).tz('Europe/London'),
                end_date = moment(this.data._parent?.end_date).tz('Europe/London')

            start_time.start_hrs = start_date.hours()
            start_time.end_hrs = end_date.hours()
            start_time.start_mins = start_date.minutes()
            start_time.end_mins = end_date.minutes()

            if (start_time.end_mins == 0){
                start_time.end_hrs -= 1
            }

        }

    }

    async preSave(prev, req){

        return new Promise(async (resolve, reject) => {

            if (this.data._user_id && !this.data._user){
                this.data._user = await DB.read('users').where(['_id == '+this.data._user_id]).first()
                if (this.data._user?.name){
                    this.data.name = this.data._user.name
                }   
            }

            if (this.data._user?.name && !this.data.name){
                this.data.name = this.data._user.name
            }

            if (!this.data.name){
                this.data.name = 'Guest Booking'
            }

            if (this.data._parent){
                if (this.data._parent.name){
                    this.data.event = this.data._parent.name
                }
                if (this.data._parent._location_id){
                    this.data._location_id = this.data._parent._location_id
                }
            }

            if (this.data.attendance && isSet(req, 'session','user','_id')){
                this.data.attendance_taken = moment().toISOString()
                this.data._attendance_taken_id = req.session.user._id
            }

            if (this.data._parent?.start_date){
                this.data.start_date = this.data._parent.start_date
            }

            if (this.data._parent?.end_date){
                this.data.end_date = this.data._parent.end_date
            }

            if (this.data.start_time_obj?.hrs >= 0 && this.data._parent?.start_date){

                if (!this.data.duration){
                    reject('Please specify a duration for this record')
                } else {

                    let parent_start = moment(this.data._parent.start_date).tz('Europe/London'),
                        parent_end = moment(this.data._parent.end_date).tz('Europe/London')

                    this.data.start_date = parent_start.clone().set({
                        hours: this.data.start_time_obj.hrs,
                        minutes: this.data.start_time_obj.mins ? this.data.start_time_obj.mins : 0,
                        seconds: 0
                    })

                    this.data.end_date = this.data.start_date.clone().add(this.data.duration,'minutes')

                    if (this.data.end_date.isAfter(parent_end)){
                        reject('Please adjust the duration as it takes this record past the end of the calendar item by '+this.data.end_date.diff(parent_end,'minutes')+' minutes')
                    }

                    if (this.data.start_date.isBefore(parent_start)){
                        reject('Please adjust the start time as it\'s before the start of the calendar item by '+parent_start.diff(this.datastart_date,'minutes')+' minutes')
                    }

                    this.data.start_date = this.data.start_date.toISOString()
                    this.data.end_date = this.data.end_date.toISOString()
                }
                
            } 

            if (this.data.start_date && this.data.end_date){

                if (!this.data.start_date.match(/Z$/)){
                    this.data.start_date = new Date(this.data.start_date).toISOString()
                }
    
                if (!this.data.end_date.match(/Z$/)){
                    this.data.end_date = new Date(this.data.end_date).toISOString()
                }
    
                let start_date = moment(this.data.start_date).tz('Europe/London'),
                    end_date = moment(this.data.end_date).tz('Europe/London')
    
                if (start_date.isAfter(end_date) || end_date.diff(start_date,'minutes') < 1){
                    this.error = 'End date must be after start date'
                    reject('End date must be after start date')
                    return
                }
    
                this.data.duration = Math.round(end_date.diff(start_date,'milliseconds')/60000)
                this.data.start_time = start_date.format('HH:mm')
                this.data.start_hrs = start_date.hour()
                this.data.start_mins = start_date.minute()
                this.data.start_day = start_date.day()
                this.data.start_day_str = start_date.format('dddd')
    
                this.data.end_time = end_date.format('HH:mm')
                this.data.end_hrs = end_date.hour()
                this.data.end_mins = end_date.minute()
                this.data.end_day = end_date.day()
                this.data.end_day_str = end_date.format('dddd')
    
            }

            if (this.data._price){
                this.calcTotals()
            }
            
            resolve(this)

        })

    }

    async postSave(){

        if (this.data._price){
                this.calcTotals()
            }

            return this

    }


}

export default LessonSessions