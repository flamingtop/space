window.BlockView = Backbone.View.extend({

  initialize: function() {


    
    this.model
      .bind('destroy', function() {
        this.$el.fadeOut(function(el){
          $(this).remove();
        });
      }, this)
      .bind('sync', function() {
        c.log('synced ', this.model.attributes);
        this.$el.replaceWith(this.render().$el)
      }, this)
      .bind('select', function(e) {
        // if(!e.ctrlKey) { // multiple selection
        //   _.each(App.collection.models, function(model) {
        //     model.trigger('deselect');
        //   });
        // }
        var that = this;
        this.model.selected = true;
        that.$el.addClass('selected');
        
        /*
          $("html, body").animate(
          {
          scrollTop: (that.$el.position().top - 20) + "px",
          scrollLeft: (that.$el.position().left - 20) + "px"
          },
          {
          duration: 150,
          easing: "swing",
          complete: function() {
          that.$el.css('background', 'yellow');
          }
          }
          );
        */

      }, this)
      .bind('deselect', function() {
        this.model.selected = false;
        this.$el.removeClass('selected');
      }, this)
      .bind('delete', function() { // not the same to the 'remove' event
        confirm("Sure?") && this.model.destroy(); 
      }, this)
      .bind('change', function() {
        c.log('Changed attributes:', this.model.changedAttributes());
      },this);
  },

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
      if(e.altKey) {
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
          App.collection.add(new_model);
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
          c.log($.extend(ui.size, ui.position));
          that.model.save(ui.size);
        }
      });
    if(this.model.selected) this.$el.addClass('selected');
    return this;
  }

});
