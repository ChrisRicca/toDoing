

// var WorkChunk = Backbone.Model.extend({
//     // validate: function (attrs) {
//     //     if (!attrs.to_do || !_.isString(attrs.to_do) || attrs.to_do.length === 0) {
//     //         return "to_do must be a string with a length";
//     //     }
//     // }
// });


// var WorkSession = Backbone.Collection.extend({
//     model: WorkChunk,
//     
//     initialize: function() {
//         // do something?
//     }
// });

// var work_session = new WorkSession;
$(function(){
    var WorkChunk = Backbone.Model.extend({
        
    });
    
    var WorkChunkView = Backbone.View.extend({
       model: WorkChunk,
       
       el: 'li',
       
    });
    
    var MainView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'startWork')
        },
    
        el: $('body'),
    
        events: {
           'submit #new_work_chunk':'startWork'
        },
    
        startWork: function(e) {
            e.preventDefault();
            $('form#new_work_chunk').hide().find('input[type=text]').val("");
        }
    });

    main_view = new MainView;
    
});
