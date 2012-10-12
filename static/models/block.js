window.Block = Backbone.Model.extend({
  urlRoot: '/page/' + PAGE.id + '/block',
  
  initialize: function(data) {
    this.init_editor_view();
    this.init_display_view();
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
  }
  
});
