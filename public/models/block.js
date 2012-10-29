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
        if(this.isNew()) window.blocks.add(this);
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
          blocks.listview.render();
        });
      }, this)
      .bind('sync', function() {
        this.view.$el
          .hide()
          .replaceWith(this.view.render().$el)
          .fadeIn();
        this.collection.listview.render();
      }, this)
      .bind('block:select', function(e) {
        this.selected = true;
        this.view.$el.addClass('selected');
        this.collection.listview.$el.find('#'+this.cid).addClass('selected');
      }, this)
      .bind('block:deselect', function() {
        this.selected = false;
        this.view.$el.removeClass('selected');
        this.collection.listview.$el.find('#'+this.cid).removeClass('selected');       }, this)
      .bind('delete', function() {
        confirm("Sure?") && this.destroy(); 
      }, this)
      .bind('change', function() {
      },this)
      .bind('block:focus', function() {
        $('html,body').animate({
          scrollTop: this.get('top')+'px',
          scrollLeft: this.get('left')+'px'
        });
      }, this);
  }
  
});
