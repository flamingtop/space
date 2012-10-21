window.PageView = Backbone.View.extend({
  
  el: $('#page'),
  
  initialize: function() {
    
    var that = this;

    // 
    that.$el.bind('dblclick', function(e) {
      (new Block({top:e.pageY, left:e.pageX, raw:''})).trigger('block:edit:start');
    });
    
    //
    that.$el
      .width(this.model.get('width'))
      .height(this.model.get('height'))
      .draggable({
        cursor: "move",
        axis: "y",
        start: function(e, ui) {
          that.$el.css('backgroundColor', '#eee');
        },
        stop: function(e, ui) {
          var delta_left = ui.position.left - ui.originalPosition.left;
          var delta_top = ui.position.top - ui.originalPosition.top;
          var new_page_width = that.$el.width() + Math.abs(delta_left);
          var new_page_height = that.$el.height() + Math.abs(delta_top);

          var changes = {};
          if(that.$el.draggable('option', 'axis') == 'y') {
            changes = {height:new_page_height};
          } else {
            changes = {width:new_page_width}
          }
          that.model.save(changes, {
            success: function(model, resp, callback) {
              _.each(blocks.models, function(model){
                model.save({ top: model.get('top') + delta_top,
                             left: model.get('left') + delta_left });
              });
            }
          });
        }
      });
    
    //
    $(document)
      .bind('keydown', 'shift', function() {
        that.$el.draggable('option', 'axis', 'x');
        that.$el.find('.block')
          .draggable('option', 'helper', 'clone')
          .resizable('option', 'aspectRatio', true);
        c.log('Block draggable helper: clone');
      })
      .bind('keyup', 'shift', function() {
        that.$el.draggable('option', 'axis', 'y');
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
      })
      .bind('keypress', '`', function(e) {
        e.preventDefault();
        if(that.model.editor.on === true)
          that.model.trigger('page:edit:end');
        else
          that.model.trigger('page:edit:start');
      });
  }

});
