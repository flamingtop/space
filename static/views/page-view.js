window.PageView = Backbone.View.extend({
  
  el: $('#page'),
  
  initialize: function() {

    // page edit box
    var that = this;
    this.edit_box = new PageEditView({model:this.model});
    this.model.on('page:edit:start', function(){
      this.edit_box.on = true;
      this.edit_box.show();
      this.edit_box.$el.find('textarea').focus().val(this.model.get('raw'));
    }, this);
    this.model.on('page:edit:end', function(){
      this.edit_box.on = false;
      this.edit_box.hide();
      this.edit_box.$el.find('textarea').blur();
      var raw = $.trim(this.edit_box.$el.find('textarea').val());
      if(this.model.get('raw') != raw)
        this.model.save({raw:raw});
    }, this);
    $(document).bind('keypress', '`', function(e) {
      e.preventDefault();
      if(that.edit_box.on === true)
        that.model.trigger('page:edit:end');
      else
        that.model.trigger('page:edit:start');
    });
    this.edit_box.$el.find('textarea').bind('keydown', 'esc', function(){
      that.model.trigger('page:edit:end');
    });


    

    this.collection.bind('add', this._add, this);
    
    this.$el.bind('dblclick', function(e) {
      (new Block({top:e.pageY, left:e.pageX, raw:''})).trigger('block:edit:start');
    });


    $(document)
      .bind('keydown', 'shift', function() {
        that.$el.find('.block')
          .draggable('option', 'helper', 'clone')
          .resizable('option', 'aspectRatio', true);
        c.log('Block draggable helper: clone');
      })
      .bind('keyup', 'shift', function() {
        that.$el.find('.block')
          .draggable('option', 'helper', 'original')
          .resizable('option', 'aspectRatio', false);
        c.log('Block draggable helper: original');
      })
      .bind('keyup', 'ctrl+d', function(e) {
        // not binding to the 'del' command is because 
        // mac has a different 'del' than pc keboards
        e.preventDefault();
        var selected = BlockList.selected();
        if(!selected.length || !confirm('Delete'+selected.length+' items?')) return false;
        _.each(selected, function(model) {
          model.destroy();
        });
      })
      .bind('keyup', 'alt+left', function(e){
        e.preventDefault();
        BlockList.moveSelected('left');
      })
      .bind('keyup', 'alt+right', function(e){
        e.preventDefault();
        BlockList.moveSelected('right');
      })
      .bind('keyup', 'alt+up', function(e){
        e.preventDefault();          
        BlockList.moveSelected('up');
      })
      .bind('keyup', 'alt+down', function(e){
        e.preventDefault();          
        BlockList.moveSelected('down');
      });
  },
  render: function() {
    _.each(this.collection.models, function(item, idx) {
      this._add(item);
    }, this);
    return this;
  },
  _add: function(model) {
    $('#page').append(model.view.render().el);
  }
});
