$(function(){

  window.Block = Backbone.Model.extend({}, {
    create: function(model, options) {
      if(model.isNew()) App.collection.add(model);
      options || (options = {});
      model.save(null, options)
    }
  });

  window.BlockList = Backbone.Collection.extend({
    model: Block,
    //    url: '/list'
    localStorage: new Store('page')
  });

  window.AppView = Backbone.View.extend({

    el: $('#page'),
    
    initialize: function() {
      this.collection.bind('reset', this.addAll, this);
      this.collection.bind('add', this.addOne, this);
      this.$el.bind('dblclick', function(e) {
        e.stopPropagation();
        new EditView({model:new Block({top:e.pageY, left:e.pageX, text:''})}).render();
      });
      this.collection.fetch();

      var that = this;
      $(document).bind('keydown', 'shift', function() {
        that.$el.find('.block').draggable('option', 'helper', 'clone');
        c.log('Block draggable helper: clone');
      });
      $(document).bind('keyup', 'shift', function() {
        that.$el.find('.block').draggable('option', 'helper', 'original');
        c.log('Block draggable: set helper: original');
      });
    },

    addAll: function(models) {
      models.each(this.addOne);
    },

    addOne: function(model) {
      var view = new BlockView({model:model});
      $('#page').append(view.render().el);
    },

  });

  
  // Block View
  window.BlockView = Backbone.View.extend({

    initialize: function() {

      this.model.bind('destroy', function() {
	this.$el.remove();
      }, this);
      
      var that = this;
      this.model.bind('sync', function() {
	that.$el.replaceWith(that.render().$el)
      });

      // re-render model's view
      // this.model.bind('refresh', function() {
      //   this.$el.replaceWith(this.render().$el);
      // }, this);
      
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
        opacity: 0.4,
        grid: [5,5],
        scroll: false,
        snap: true,
        snapMode: 'both',
        snapTollerance: 10,
        //stack: '.block',
        //zIndex: 5000,
	stop: function(e, ui) {
          if(e.shiftKey) {
            var model = that.model.clone().unset('id').set(ui.position);
            Block.create(model);
          } else {
            that.model.save(ui.position);
          }
          $('#glv').fadeOut();
          $('#glh').fadeOut();
	},
        drag: function(e, ui) {
          $('#glv').css('left', ui.offset.left+'px').fadeIn();
          $('#glh').css('top', ui.offset.top+'px').fadeIn();
        }
      });
      return this;
    }

  });

  window.BlockToolboxView = Backbone.View.extend({

    events: {
      'click .edit': function(e) {
	e.stopPropagation();
	var model = this.options.block.model;
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

  window.EditView = Backbone.View.extend({

    initialize: function() {
      
      var that = this;
      that.setElement($(Mustache.render($('#template-editbox').html(), that.model.toJSON())));

      that.$el.find('textarea')
        .bind('keydown', 'esc', function() {
          that.close();
          return false;
          // Block.create(that.model, {
	        // success:function(){
	        // that.close();
	        // }
	        // });
        })
        .bind('keydown', 'ctrl+s', function(e) {
          e.preventDefault();
	        that.model.set({'text':that.$el.find('textarea').val()});
	        Block.create(that.model, {});
          return false;
        })
        .bind('keydown', _.debounce(function(){
	        var oldText = that.model.get('text'),
	        newText = that.$el.find('textarea').val();

	        if(oldText != newText) {
	          that.model.set({'text':newText});
	          Block.create(that.model, {});
	        }
	      }, 1000));
    },

    render: function() {
      var that = this;
      this.$el
        .appendTo($('body'))
        .draggable()
        .animate({
          top: '+=25',
          left: '+=25'
        })
        .find('textarea').focus();
    },

    close: function() {
      this.$el.fadeOut(function(ele) { $(ele).remove(); });
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






