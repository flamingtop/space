$(function(){

  // Application View
  window.AppView = Backbone.View.extend({

	  el: $('#page'),

	  events: {
		  "dblclick": "openEditor"
	  },

    openEditor: function(e) {
      e.stopPropagation();
      var newBlock = new Block({top:e.pageY, left:e.pageX, text:''});
      new EditView({model:newBlock}).render();
	  },

	  initialize: function() {
      this.collection.bind('reset', this.addAll, this);
      this.collection.bind('add', this.addOne, this);
      // automatic saver objects
      if(typeof window.AUTOSAVERS == 'undefined') window.AUTOSAVERS = {};
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
      that.setElement($(Mustache.render(
        $('#template-editbox').html(),
        that.model.toJSON())
      ));

      that.$el.keyup(function(e){
        if(e.which == 27) {
          // esc
          Block.create(that.model, {
            success:function(){
              that.close();
              // rerender the block
              that.model.trigger('refresh');
            },
            error:function(){
              c.error('Save failed, model ', that.model);
            }
          });
        } else if(e.which == 83 && e.ctrlKey == true) {
          // ctrl + s
          that.model.set({'text':that.$el.find('textarea').val()});
          Block.create(that.model);
        } else {
          // normal typing
          if(typeof window.AUTOSAVERS[that.model.id] != 'undefined') {
            clearTimeout(window.AUTOSAVERS[that.model.id]);
          }
          window.AUTOSAVERS[that.model.id] = setTimeout(function(){
            var oldText = that.model.get('text'),
                newText = that.$el.find('textarea').val();

            if(oldText != newText) {
              that.model.set({'text':newText});
              Block.create(that.model, {
                success: function() {},
                error: function() { c.error('Auto save failed ', that.model); }
              });
            }
          }, 1250);
        }
      });
    },

	  render: function() {
      this.$el.appendTo($('body')).find('textarea').focus();
	  },

    // close view
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

window.c = (function(console){
  
  var consoleFunctions = {};
  
  $.each(
    
    [
      'log', 'debug', 'info', 'warn', 'error', 
      'assert', 'alert', 'dir', 'dirxml', 'trace', 
      'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 
      'profile', 'profileEnd', 'count'
    ],
    
    function(i, methodName) {
      
      var consoleFuncAvailable = (window.console && console[methodName]);
      var mockDummyConsole = !consoleFuncAvailable;
      
      if(mockDummyConsole) {
        // dummy console functions
        consoleFunctions[methodName] = function(){ return false; };
      } else {
        consoleFunctions[methodName] = function() {
          if($.browser.msie) {
            
            /**** Fix IE's console object ****/
            
            // Why?
            // @see http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
            // @see http://patik.com/blog/complete-cross-browser-console-log/
            // @see http://patik.com/demos/consolelog/consolelog.js for even more browser support
            if (Function.prototype.bind && console && typeof console[methodName] == "object") {
              // IE9
              return (Function.prototype.bind.call(console[methodName], console)).apply(console, arguments);
            }
            else if (!Function.prototype.bind && typeof console != 'undefined' && typeof console[methodName] == 'object') {
              // IE8
              return Function.prototype.call.call(console[methodName], console, Array.prototype.slice.call(arguments));
            }
            else {
              // don't care about the lower versions IEs
              return false;
            }
          }
          else {
            return console[methodName].apply(console, arguments);
          }
        };
      }
      
    });
  
  return consoleFunctions;
  
})(window.console);





