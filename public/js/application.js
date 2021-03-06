// Use mustache-style templating
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

$(function(){
    var WorkChunk = Backbone.Model.extend({
        defaults: {
            completed: null,
            started_at: null,
            ended_at: null,
            description:"do some stuff..."
        },
        initialize: function() {
            _.bindAll(this,'start_now','end_now','elapsed_time_display','elapsed_time')
            
            this.target_duration = (1000*60*30) // 30 minutes
            
            if (this.isNew())
                this.start_now();
        },
        start_now: function() {
            var now = new Date();
            this.save({started_at:now.getTime()})
        },
        end_now: function(completed) {
            if (_(completed).isUndefined())
                var completed = true;
                
            if (!this.get('ended_at')) {
                var now = new Date();
                this.save({ended_at:now.getTime(),completed:completed})                
            }
        },
        elapsed_time: function() {
            if (this.get('ended_at')) {
                return this.get('ended_at') - this.get('started_at')
            } else {
                return (new Date()).getTime() - this.get('started_at')
            }
        },
        elapsed_time_display: function() {
            var elapsed_milliseconds = this.elapsed_time();
            
            var time_to_display = this.is_late() || this.is_ended() ? elapsed_milliseconds : (this.target_duration + 1000) - elapsed_milliseconds
            
            
            var minutes = parseInt(time_to_display / (1000*60))
            var seconds = parseInt((time_to_display / 1000) - (minutes * 60))
            
            return (this.is_late() || this.is_ended() ? "" : "-") + (minutes < 10 ? "0" + minutes.toString() : minutes.toString()) +":"+(seconds < 10 ? "0" + seconds.toString() : seconds.toString())
        },
        point_value: function() {
        
          if(!this.is_ended())
            return 0;
          
          var time_in_mins = this.elapsed_time() / (1000*60);

          if(!this.is_completed()) {
            return (time_in_mins > 10) ? 2 : 0;
          }
          
          if(time_in_mins < 5)
            return 0;
          if(time_in_mins < 10)
            return 1;
          if(time_in_mins < 15)
            return 3;
          if(time_in_mins < 20)
            return 6;
          if(time_in_mins < 25)
            return 10;
          if(time_in_mins < 30)
            return 15;
          if(time_in_mins < 45)
            return 10;
          
          // over 45 minutes
          return 5;
              
        },
        is_late: function(){
          return this.elapsed_time() > this.target_duration
        },
        is_ended: function(){
            return !!this.get('ended_at')
        },
        
        is_completed: function() {
            return this.is_ended() && this.get('completed')
        }
    });
    
    var WorkChunkList = Backbone.Collection.extend({
        model: WorkChunk,
        localStorage: new Store("work_chunks"),
        active: function(){
            return this.detect(function(chunk){ return chunk.ended_at })
        },
        
        comparator: function(chunk) {
            return chunk.get('started_at');
        }
    });
    window.WorkChunks = new WorkChunkList;
    
    
    var WorkChunkView = Backbone.View.extend({
        tagName: "li",
        className: 'work_chunk',
        
        events: {
            'click .complete':'handleCompleted',
            'click .cancel':'handleCanceled'
        },
        
        template: _.template($('#work_chunk_template').html()),
        
        initialize: function() {
            _.bindAll(this, 'render','remove','updateElapsedTimeDisplay')
            this.model.bind('change', this.render)
            this.model.bind('destroy', this.remove)
            
            this.last_alert = this.model.elapsed_time();
        },
        
        handleCompleted: function(e) {
            e.preventDefault();
            this.model.end_now();
        },
        
        handleCanceled: function(e) {
            e.preventDefault();
            this.model.end_now(false);
        },
        
        render: function() {
            var json = this.model.toJSON();
            json.elapsed_time = this.model.elapsed_time_display();
            json.point_value = this.model.point_value();
            
            $(this.el).html(this.template(json));
                
            if (this.model.is_ended())
                $(this.el).addClass('ended');
            
            if (this.model.is_ended() && !this.model.is_completed())
                $(this.el).addClass('canceled')
                
            this.setDisplayTimer();
            
            return this;
        },
        
        remove: function() {
          $(this.el).remove();  
        },
        
        setDisplayTimer: function() {
            if(this.timer)
                clearInterval(this.timer);
            
            if(!(this.model.is_ended())) {
                this.timer = setInterval(this.updateElapsedTimeDisplay, 1000);
            }
        },
        
        updateElapsedTimeDisplay: function() {
            this.$('.time_elapsed').html(this.model.elapsed_time_display)
            $(document).find('title').html(this.model.elapsed_time_display() + " " + this.model.get('description'));
            
            // alerts
            if(window.webkitNotifications && window.webkitNotifications.checkPermission() == 0 && !this.model.is_ended()) {
                // check for alert
                
                var interval_duration = (1000*60*5) // 5 mins
                
                var last_alert_interval = parseInt(this.last_alert / interval_duration)

                var next_alert = (last_alert_interval * interval_duration) + interval_duration
                if(this.model.elapsed_time() > next_alert) {
                    this.last_alert = parseInt(this.model.elapsed_time() / interval_duration) * interval_duration;
                    
                    var n = window.webkitNotifications.createNotification('logo.png', this.model.elapsed_time_display(), this.model.get('description'))
                    n.ondisplay = function() {
                        setTimeout(function(){ n.cancel() },1000*20) // 20 seconds
                    }
                    n.onclick = function() { window.focus() }
                    n.show();
                }
            }
        }
        
        
    });
    
    var AppView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'addWorkChunk','reset','toggleNewWorkForm','completeOnEnter','clickClearAll','handleEnableNotifications','calculateTotal')
            
            WorkChunks.bind('add', this.addWorkChunk)
            WorkChunks.bind('all', this.calculateTotal)
            WorkChunks.bind('all', this.toggleNewWorkForm)            
            
            if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0)
                $('#notifications').show();
            
            this.reset();
        },
    
        el: $('body'),
    
        events: {
           'submit #new_work_chunk':'addOnFormSubmit',
           'keypress':'completeOnEnter',
           'click #clear_all':'clickClearAll',
           'click #notifications':'handleEnableNotifications'
        },
    
        addOnFormSubmit: function(e) {
            e.preventDefault();
            
            var description = $('#new_work_chunk input[type=text]').val();
            WorkChunks.create({description:description})
        },
        
        addWorkChunk: function(work_chunk) {
            var view = new WorkChunkView({model: work_chunk})
            this.$("#work_chunks").prepend(view.render().el)
        },
        
        reset: function() {
            this.$("#work_chunks").html("");
            WorkChunks.fetch();
            var self = this;
            WorkChunks.each(function(chunk){
                self.addWorkChunk(chunk);
            });
            this.toggleNewWorkForm();
        },
        
        hasActiveWork: function() {
            return WorkChunks.any(function(chunk){ return !chunk.get('ended_at') })
        },
        toggleNewWorkForm: function() {
          if(this.hasActiveWork()) {
              $('form#new_work_chunk').hide().find('input[type=text]').val('').blur();
          } else {
              this.resetForm();
          }
        },
        completeOnEnter: function(e) {
          if(this.hasActiveWork() && e.keyCode == 13) {
            WorkChunks.detect(function(chunk){return !chunk.is_ended()}).end_now()
          }
        },
        resetForm: function() {
            $('form#new_work_chunk').show().find('input[type=text]').val('').focus();
            $(document).find('title').html("toDoing.org - get something done.");
        },
        clickClearAll: function(e) {
            e.preventDefault();
            
            while(WorkChunks.length > 0)
                WorkChunks.each(function(chunk){chunk.destroy()});            
        },
        handleEnableNotifications: function(e) {
            e.preventDefault();
            
            if (window.webkitNotifications.checkPermission() != 0) { // 0 is PERMISSION_ALLOWED
                window.webkitNotifications.requestPermission();
                $('#notifications').hide();
            }
        },
        calculateTotal: function() {
            var total = WorkChunks.reduce(function(memo, chunk){
                return memo + chunk.point_value();
            },0)
            
            $("#total").toggle(total > 0).find('span').html(total);
                
        }
    });
    app_view = new AppView;
});
