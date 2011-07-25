// Use mustache-style templating
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

$(function(){
    var WorkChunk = Backbone.Model.extend({
        defaults: {
            complete: false,
            started_at: null,
            ended_at: null,
            description:"do some stuff..."
        },
        initialize: function() {
            _.bindAll(this,'start_now','complete_now','elapsed_time_display')
            this.start_now();
        },
        start_now: function() {
            var now = new Date();
            this.save({started_at:now.getTime()})
        },
        complete_now: function() {
            if (!this.get('ended_at')) {
                var now = new Date();
                this.save({ended_at:now.getTime(),complete:true})
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
    var WorkChunks = new WorkChunkList;
    
    
    var WorkChunkView = Backbone.View.extend({
        tagName: "li",
        className: 'work_chunk',
        
        events: {
            'click .complete':'handleCompleted'
        },
        
        template: _.template($('#work_chunk_template').html()),
        
        initialize: function() {
            _.bindAll(this, 'render','updateElapsedTimeDisplay')
            this.model.bind('change', this.render)
        },
        
        handleCompleted: function(e) {
            e.preventDefault();
            this.model.complete_now();
        },
        
        render: function() {
            var json = this.model.toJSON();
            json.elapsed_time = this.model.elapsed_time_display();
            
            $(this.el).html(this.template(json));
            
            if (this.model.is_ended())
                $(this.el).addClass('ended');
            
            if (this.model.is_ended())
                $(this.el).addClass('ended');
            
            this.setDisplayTimer();
            
            return this;
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
            _.bindAll(this, 'addWorkChunk','toggleNewWorkForm')
            
            WorkChunks.bind('add', this.addWorkChunk)
            WorkChunks.bind('add', this.toggleNewWorkForm)
            WorkChunks.bind('change', this.toggleNewWorkForm)
            
            this.resetForm();
        },
    
        el: $('body'),
    
        events: {
           'submit #new_work_chunk':'addOnFormSubmit'
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
        resetForm: function() {
            $('form#new_work_chunk').show().find('input[type=text]').val('').focus();
        }
    });
    app_view = new AppView;
});
