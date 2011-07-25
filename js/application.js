// Use mustache-style templating
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

$(function(){
    var WorkChunk = Backbone.Model.extend({
        defaults: {
            finished: false,
            started_at: null,
            display_time: '00:00',
            ended_at: null,
            description:"do some stuff..."
        },
        initialize: function() {
            _.bindAll(this,'start_now','finish_now')
            this.start_now();
        },
        start_now: function() {
            var now = new Date();
            this.save({started_at:now.getTime()})
        },
        finish_now: function() {
            var now = new Date();
            this.save({ended_at:now.getTime(),finished:true})
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
        class_name: 'work_chunk',
        
        events: {
            'click .finish':'handleFinished'
        },
        
        template: _.template($('#work_chunk_template').html()),
        
        initialize: function() {
            _.bindAll(this, 'render')
            this.model.bind('change', this.render)
            // this.model.view = this;
        },
        
        handleFinished: function(e) {
            e.preventDefault();
            this.model.finish_now();
        },
        
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
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
