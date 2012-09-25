$(function(){

  window.Block = Backbone.Model.extend({}, {
    create: function(model, options) {
      model.isNew() && App.collection.add(model);
      options || (options = {});
      model.save({}, options);
    }
  });

  window.BlockList = Backbone.Collection.extend({
    model: Block,
    localStorage: new Store('page')
  });

  window.AppView = Backbone.View.extend({
    el: $('#page'),
    initialize: function() {
      this.collection.bind('reset', this.addAll, this);
      this.collection.bind('add', this.addOne, this);
      this.$el.bind('dblclick', function(e) {
        new EditView({model:new Block({top:e.pageY, left:e.pageX, text:''})}).render();
      });
      this.collection.fetch();

      var that = this;
      $(document).bind('keydown', 'shift', function() {
        that.$el.find('.block')
          .draggable('option', 'helper', 'clone')
          .resizable('option', 'aspectRatio', true);
        c.log('Block draggable helper: clone');
      });
      $(document).bind('keyup', 'shift', function() {
        that.$el.find('.block')
          .draggable('option', 'helper', 'original')
          .resizable('option', 'aspectRatio', false);
        c.log('Block draggable: set helper: original');
      });
    },
    addAll: function(models) {
      models.each(this.addOne);
    },
    addOne: function(model) {
      var view = new BlockView({model:model});
      $('#page').append(view.render().el);
    }
  });

  
  window.BlockView = Backbone.View.extend({

    initialize: function() {
      this.model
        .bind('destroy', function() {
          this.$el.remove();
        }, this)
        .bind('sync', function() {
          c.log('synced ', this.model.attributes);
          this.$el.replaceWith(this.render().$el)
        }, this)
        .bind('edit', function() {
          new EditView({model: this.model}).render();
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
      that.$el.find('textarea')
        .bind('keydown', 'esc', function() {
          that.close();
          return false;
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


  // Instance of the Application
  window.App = (new AppView({collection:new BlockList()})).render();
  
  // Bootstrap Block List
  /*  App.collection.reset([
      {text:'hello', top:100, left:20},
      {text:'hello', top:200, left:80},    
      ]);
  */

});






