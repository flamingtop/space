window.BlockView = Backbone.View.extend({

  events: {
    /*
      'mouseenter': function(e) {
      this.toolbox = new BlockToolboxView({model:this.model}).render().$el;
      this.$el.append(this.toolbox);
      },
      'mouseleave': function(e) {
      this.toolbox.remove();
      },
    */
    'dblclick': function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.model.trigger('block:edit:start');
    },
    'click': function(e) {
      e.stopPropagation();
      if(e.shiftKey) {
        if(this.model.selected)
          this.model.trigger('deselect', e);
        else
          this.model.trigger('select', e);
      }
    }
  },

  render: function() {
    var that = this;
    var glv = $('#glv');
    var glh = $('#glh');

    this.setElement(Mustache.render($('#template-blockview').html(), this.model.toJSON()));
    this.$el.draggable({
      opacity: 0.4,
      grid: [5,5],
      scroll: false,
      snap: true,
      //snapMode: 'both',
      snapTollerance: 5,
      //stack: '.block',        
      //zIndex: 5000,
      stop: function(e, ui) {
        glv.fadeOut(); glh.fadeOut();
        if(e.shiftKey) {
          var new_model = that.model.clone().unset('id').set(ui.position, {silent:true});
          blocks.add(new_model);
          new_model.save();
        } else {
          that.model.save(ui.position);
        }
      }
      // drag: function(e, ui) {
      //   glv.css('left', ui.offset.left+'px').show('fast');
      //   glh.css('top', ui.offset.top+'px').show('fast');
      // }
    })
      .resizable({
        autoHide: true,
        //minHeight: 100,
        //minWidth: 100,
        //grid: [5,5],
        handles: 'all',
        //helper: 'ui-resizable-helper',
        //ghost: true,
        containment: 'parent',
        stop: function(e, ui) {
          that.model.save(ui.size);
        }
      });
    if(this.model.selected) this.$el.addClass('selected');
    return this;
  }

});
