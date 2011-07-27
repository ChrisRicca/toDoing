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
            _.bindAll(this,'start_now','end_now','elapsed_time_display')
            
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
                console.log('END NOW')
                
            }
        },
        
        elapsed_time_display: function() {
            if (this.get('ended_at')) {
                var elapsed_milliseconds = this.get('ended_at') - this.get('started_at')
            } else {
                var elapsed_milliseconds = (new Date()).getTime() - this.get('started_at')
            }
            
            var minutes = parseInt(elapsed_milliseconds / (1000*60))
            var seconds = parseInt((elapsed_milliseconds / 1000) - (minutes * 60))
            
            return (minutes < 10 ? "0" + minutes.toString() : minutes.toString()) +":"+(seconds < 10 ? "0" + seconds.toString() : seconds.toString())
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
        }
        
        
    });
    
    var AppView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'addWorkChunk','reset','toggleNewWorkForm','completeOnEnter','clickClearAll')
            
            WorkChunks.bind('add', this.addWorkChunk)
            WorkChunks.bind('all', this.toggleNewWorkForm)            
            
            this.reset();
        },
    
        el: $('body'),
    
        events: {
           'submit #new_work_chunk':'addOnFormSubmit',
           'keypress':'completeOnEnter',
           'click #clear_all':'clickClearAll'
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
        console.log("completeOnEnter");
          if(this.hasActiveWork() && e.keyCode == 13) {
            WorkChunks.detect(function(chunk){return !chunk.is_ended()}).end_now()
          }
        },
        resetForm: function() {
            $('form#new_work_chunk').show().find('input[type=text]').val('').focus();
        },
        clickClearAll: function(e) {
            e.preventDefault();
            
            while(WorkChunks.length > 0)
                WorkChunks.each(function(chunk){chunk.destroy()});            
        }
    });
    app_view = new AppView;
});
