$(function(){

  window.Block = Backbone.Model.extend({
    urlRoot: 'http://localhost:9393/block'
  });
  window.Page  = Backbone.Model.extend({
    urlRoot: 'http://localhost:9393/page'
  });

  window.BlockList = Backbone.Collection.extend({
    model: Block,
    url: 'http://localhost:9393/page/' + page.id + '/blocks'
    // localStorage: new Store('page')
  }, {
    selected: function() {
      return _.filter(App.collection.models, function(model){
        return model.selected;
      });
    }
  });

  window.AppView = Backbone.View.extend({
    
    el: $('#page'),
    
    initialize: function() {

      this.collection.bind('add', this._add, this);
      
      this.$el.bind('dblclick', function(e) {
        new EditView({model:new Block({top:e.pageY, left:e.pageX, text:''})}).render();
      });

      var that = this;
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
          c.log('Block draggable: set helper: original');
        })
        .bind('keyup', 'del', function() {
          var selected = BlockList.selected();
          if(!selected.length || !confirm('Delete'+selected.length+' items?')) return false;
          _.each(selected, function(model) {
            model.destroy();
          });
          
        });
    },
    render: function() {
      _.each(this.collection.models, function(item, idx) {
        this._add(item);
      }, this);
      return this;
    },
    _add: function(model) {
      $('#page').append((new BlockView({model:model})).render().el);
    }
  });

  
  window.BlockView = Backbone.View.extend({

    initialize: function() {

      this.model.view = this; // bind current view to its model
      
      this.model
        .bind('destroy', function() {
          this.$el.fadeOut(function(){
            $(this).remove();
          });
        }, this)
        .bind('sync', function() {
          c.log('synced ', this.model.attributes);
          this.$el.replaceWith(this.render().$el)
        }, this)
        .bind('edit', function() {
          new EditView({model: this.model}).render();
        }, this)
        .bind('select', function(e) {
          // if(!e.ctrlKey) { // multiple selection
          //   _.each(App.collection.models, function(model) {
          //     model.trigger('deselect');
          //   });
          // }
          var that = this;
          this.model.selected = true;
          $("html, body").animate(
            {
	      scrollTop: that.$el.position().top + "px",
              scrollLeft: that.$el.position().left + "px"
	    },
            {
	      duration: 150,
	      easing: "swing",
              complete: function() {
                that.$el.css('background', 'yellow');
              }
	    }
          );

        }, this)
        .bind('deselect', function() {
          this.model.selected = false;
          this.$el.css('background', '');
        }, this)
        .bind('delete', function() { // not the same to the 'remove' event
          confirm("Sure?") && this.model.destroy(); 
        }, this)
        .bind('change', function() {
          c.log('Changed attributes:', this.model.changedAttributes());
        },this);
    },

    events: {
      'mouseenter': function(e) {
        this.toolbox = new BlockToolboxView({model:this.model}).render().$el;
        this.$el.append(this.toolbox);
      },
      'mouseleave': function(e) {
        this.toolbox.remove();
      },
      'click': function(e) {
        if(!e.ctrlKey) {
          e.preventDefault();
          return false;
        }
        if(this.model.selected)
          this.model.trigger('deselect', e);
        else
          this.model.trigger('select', e);          
      },
      'dblclick': function(e) {
        e.stopPropagation();
        this.model.trigger('edit');
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
        snapMode: 'both',
        snapTollerance: 10,
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
        },
        drag: function(e, ui) {
          glv.css('left', ui.offset.left+'px').show('fast');
          glh.css('top', ui.offset.top+'px').show('fast');
        }
      })
        .resizable({
          autoHide: true,
          minHeight: 100,
          minWidth: 100,
          grid: [5,5],
          containment: 'parent',
          stop: function(e, ui) {
            that.model.save(ui.size);
          }
        });
      return this;
    }

  });

  window.BlockToolboxView = Backbone.View.extend({
    events: {
      'click .edit': function(e) {
	this.model.trigger('edit');
      },
      'click .remove': function(e) {
	this.model.trigger('delete');
      } 
    },
    initialize: function() {
      this.setElement(Mustache.render($('#template-blockview-toolbox').html()));
    },
    render: function() {
      return this;
    }
  });

  window.EditView = Backbone.View.extend({

    initialize: function() {
      var that = this;
      var save_model = function(model) {
        if(model.isNew()) App.collection.add(model);
	model.save({'text':that.$el.find('textarea').val()});
      };
      that.setElement($(Mustache.render($('#template-editbox').html(), that.model.toJSON())));

      that.bind('cancel', function() {
        that.close();
        return false;
      })
      .$el.find('textarea')
        .bind('keydown', 'esc', function() {
          that.trigger('cancel');
        })
        .bind('keydown', 'ctrl+s', function(e) {
          e.preventDefault();
          save_model(that.model);
          return false;
        })
        .bind('keydown', _.debounce(function(){
          save_model(that.model);
	}, 1000));
    },

    events: {
      'click .close': function() {
        this.trigger('cancel');
      }
    },

    render: function() {
      var that = this;
      this.$el
        .appendTo($('body'))
        .draggable()
        .animate({
          top: '+=15',
          left: '+=15'
        })
        .find('textarea')
        .focus();
    },

    close: function() {
      this.$el.fadeOut(function(el) { $(el).remove(); });
    }

  });

});






