window.Block = Backbone.Model.extend({
  urlRoot: '/page/' + PAGE.id + '/block',
  
  initialize: function(data) {
    this.init_editor_view();
    this.init_display_view();
    this.init_model_events();
  },

  init_editor_view: function() {
    this.editor = new EditView({model: this});
    this
      .bind('block:edit:start', function() {
        this.editor.render();
      }, this)
      .bind('block:edit:save', function() {
        var text = $.trim(this.editor.$el.find('textarea').val());
        if(!text.length) text = 'It\'s empty.';
        if(this.isNew()) App.collection.add(this);
        this.save({'raw':text});
      }, this)
      .bind('block:edit:end', function() {
        this.editor.close();
      }, this);
  },

  init_display_view: function() {
    this.view = new BlockView({model: this});
  },

  init_model_events: function() {
    this
      .bind('destroy', function() {
        this.view.$el.fadeOut(function(el){
          $(this).remove();
          c.log('block destroyed ', this);          
        });
      }, this)
      .bind('sync', function() {
        this.view.$el
          .hide()
          .replaceWith(this.view.render().$el)
          .fadeIn();
        c.log('block synced ', this);
      }, this)
      .bind('select', function(e) {
        this.selected = true;
        this.view.$el.addClass('selected');
      }, this)
      .bind('deselect', function() {
        this.selected = false;
        this.view.$el.removeClass('selected');
      }, this)
      .bind('delete', function() {
        confirm("Sure?") && this.destroy(); 
      }, this)
      .bind('change', function() {
        c.log('Changed attributes:', this.changedAttributes());
      },this);
  }
  
});
