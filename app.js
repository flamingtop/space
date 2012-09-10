$(function(){

  // Application View
  window.AppView = Backbone.View.extend({

    el: $('#page'),
    
    initialize: function() {

      var multi_keys = {};
      var openEditor = function(e) {
        e.stopPropagation();
        var newBlock = new Block({top:e.pageY, left:e.pageX, text:''});
        new EditView({model:newBlock}).render();
      };

      this.collection.bind('reset', this.addAll, this);
      this.collection.bind('add', this.addOne, this);
      this.$el.bind('dblclick', openEditor);
/*
      $(document).bind('keydown', 'a', function(e) {
          if(!multi_keys['a'])
            multi_keys['a'] = 1;
          else if(multi_keys['a'] < 2)
            multi_keys['a']++;
          else
            openEditor(e);
        });
*/
    },

    render: function() {
      // retrieve content list from the server
      // triger 'reset' and will be handled by this.addAll, bootstraping way is more efficient      
      this.collection.fetch({
	success: function(collection, response) {
	  c.log('Server response ', response);
	},
	fail: function(collection, repsone) {
	  c.log('Failed retrieving content list from the server');
	}
      }); 
      return this;
    },

    addAll: function(models) {
      models.each(this.addOne);
    },

    addOne: function(model) {
      var view = new BlockView({model:model});
      App.$el.append(view.render().el);
    },

  });

  // Block Model
  window.Block = Backbone.Model.extend({}, {
    create: function(model, options) {
      if(model.isNew()) App.collection.add(model);
      options || (options = {});
      model.save(null, options)
    }
  });

  // Block List Model
  window.BlockList = Backbone.Collection.extend({
    model: Block,
    localStorage: new Store('page')
  });
  
  // Block View
  window.BlockView = Backbone.View.extend({

    initialize: function() {
      this.model.bind('destroy', function() {
	this.$el.remove();
      }, this);

      // re-render model's view
      this.model.bind('refresh', function() {
	this.$el.replaceWith(this.render().$el);
      }, this);

      this.model.bind('sync', function() {
	c.debug(arguments, ' synced');
      });
    },

    events: {
      'mouseenter': function(e) {
	this.toolbox = new BlockToolboxView({block:this}).render().$el;
	this.$el.append(this.toolbox);
      },
      'mouseleave': function(e) {
	this.toolbox.remove();
      },
    },

    render: function() {
      var that = this;
      this.setElement(Mustache.render($('#template-blockview').html(), this.model.toJSON()));
      this.$el.draggable({
	//        opacity: 0.35,
	//        grid: [5,5],
	stop: function(event, ui) {
	  that.model.save(ui.position);
	}
      });
      return this;
    }

  });

  // Block Toolbox View
  window.BlockToolboxView = Backbone.View.extend({
    events: {
      'click .edit': function(e) {
	e.stopPropagation();
	var model = this.options.block.model;
	this.options.block.$el.hide();
	new EditView({model:model}).render();
      },
      'click .remove': function(e) {
	e.stopPropagation();
	this.options.block.model.destroy();
      } 
    },
    initialize: function() {
      this.setElement(Mustache.render($('#template-blockview-toolbox').html()));
    },
    render: function() {
      return this;
    }
  });

  // Editor View
  window.EditView = Backbone.View.extend({

    initialize: function() {
      
      var that = this;
      that.setElement($(Mustache.render($('#template-editbox').html(), that.model.toJSON())));

      var saved = function() {
        that.$el.find('.autosave-indicator').fadeIn(100).delay(500).fadeOut(1000);
      };

      that.$el.find('textarea')
        .bind('keydown', 'esc', function(e, el) {
	  Block.create(that.model, {
	    success:function(){
	      that.close();
	      that.model.trigger('refresh');
	    }
	  });
          return false;
        })
        .bind('keydown', 'ctrl+s', function(e) {
          e.preventDefault();
	  that.model.set({'text':that.$el.find('textarea').val()});
	  Block.create(that.model, {
            success: saved
          });
          return false;
        })
        .bind('keydown', _.debounce(function(){
	  var oldText = that.model.get('text'),
	  newText = that.$el.find('textarea').val();

	  if(oldText != newText) {
	    that.model.set({'text':newText});
	    Block.create(that.model, {
	      success: saved,
	      error: function() { c.error('Auto save failed ', that.model); }
	    });
	  }
	}, 1750));
    },

    render: function() {
      this.$el.appendTo($('body')).find('textarea').focus();
    },

    close: function() {
      this.$el.remove();
    }

  });


  // Instance of the Application
  window.App = new AppView({collection:new BlockList()});
  App.render();

  
  // Bootstrap Block List
  /*  App.collection.reset([
      {text:'hello', top:100, left:20},
      {text:'hello', top:200, left:80},    
      ]);
  */

});






