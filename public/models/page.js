window.Page  = Backbone.Model.extend({

  urlRoot: '/page',

  initialize: function(data) {
    this.editor = new PageEditView({model:this});
    this.view = new PageView({model:this});
    this.init_model_events();
  },

  init_model_events: function() {
    this.bind('change', function(model, resp, callback) {
      // 
      $(document).find('title').text(this.get('title'));
      //
      var changes = this.changedAttributes();
      if(changes.width != undefined || changes.height != undefined) {
        this.view.$el
          .width(changes.width)
          .height(changes.height)
          .find('.block').hide();
      }
      //
      this.view.$el
        .attr('title', this.get('title'))
        .css('backgroundColor', '#eee')
        .animate({
          top: '0px',
          left: '0px',
          backgroundColor: '#fff'
        });
    }, this);


    /// 
    this
      .on('page:edit:start', function(){
        this.editor.opened = true;
        this.editor.show();
        this.editor.$el.find('textarea').focus().val(this.get('raw'));
      }, this)
      .on('page:edit:end', function(){
        this.editor.opened = false;
        this.editor.hide();
        this.editor.$el.find('textarea').blur();
        var raw = $.trim(this.editor.$el.find('textarea').val());
        if(this.get('raw') != raw)
          this.save({raw:raw});
      }, this);
    
  }
  
});
