$(function(){

  window.Block = Backbone.Model.extend({
    urlRoot: '/page/' + page.id + '/block'
  });
  
  window.Page  = Backbone.Model.extend({
    urlRoot: '/page'
  });

  window.BlockList = Backbone.Collection.extend({
    model: Block,
    url: '/page/' + page.id + '/blocks' // TODO implement in lollypop.erb
    // localStorage: new Store('page')
  }, {
    selected: function() {
      return _.filter(App.collection.models, function(model){
        return model.selected;
      });
    },
    unselected: function() {
      return _.filter(App.collection.models, function(model){
        return !model.selected;
      });
    },
    edges: function(models, direction) {
      var edges = [];
      edges.push(0);      
      if('h' == direction)
        edges.push($(document).scrollLeft());
      else if('v' == direction)
        edges.push($(document).scrollTop());
      
      _.each(models, function(model) {
        if('h' == direction) {
          edges.push(model.attributes.left);
          edges.push(model.attributes.left + model.view.$el.width());
        }
        else if('v' == direction) {
          edges.push(model.attributes.top);
          edges.push(model.attributes.top + model.view.$el.height());
        }
      });
      c.log('edges ', edges);
      return _.uniq(edges);
    },
    closestEdge: function(models, side, n) {
      if('left' == side || 'right' == side)
        var edges = BlockList.edges(models, 'h');
      else if('up' == side || 'down' == side)
        var edges = BlockList.edges(models, 'v');

      if('left' == side || 'up' == side)
        return _.filter(edges, function(m) { return m < n; }).sort().reverse()[0];
      else if('right' == side || 'down' == side)
        return _.filter(edges, function(m) { return m > n; }).sort()[0];
    },
    moveSelected: function(direction) {
      var selected = BlockList.selected();
      if(!selected.length) return false;
      _.each(selected, function(model) {
        if('right' == direction || 'left' == direction) {
          var side = 'left';
          var n = model.attributes.left;
        }
        else if('up' == direction || 'down' == direction) {
          var side = 'top';
          var n = model.attributes.top
        }
        var closestEdge = BlockList.closestEdge(BlockList.unselected(), direction, n);
        
        if(closestEdge != undefined) {
          var complete = function() {
            model.set(side, closestEdge);
            model.save();
          };
          
          if('left' == direction || 'right' == direction) {
            model.view.$el.animate({
              left: closestEdge+'px'
            }, {
              'complete': complete
            });
          } else {
            model.view.$el.animate({
              top: closestEdge+'px'
            }, {
              'complete': complete
            });
          }
        }
      });
    }
  });

  window.AppView = Backbone.View.extend({
    
    el: $('#page'),
    
    initialize: function() {

      this.collection.bind('add', this._add, this);
      
      this.$el.bind('dblclick', function(e) {
        new EditView({model:new Block({top:e.pageY, left:e.pageX, raw:''})}).render();
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
      $('#page').append((new BlockView({model:model})).render().el);
    }
  });

  
  window.BlockView = Backbone.View.extend({

    initialize: function() {

      this.model.view = this; // bind current view to its model

      
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
        e.stopPropagation();
        e.stopImmediatePropagation();
      },
      'click': function(e) {
        e.stopPropagation();
        if(e.altKey) {
          this.model.trigger('edit');
        } else {
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
        var text = $.trim(that.$el.find('textarea').val());
        if(!text.length) text = '!empty';
        if(model.isNew()) App.collection.add(model);
        model.save({'raw':text});
      };
      that.setElement($(Mustache.render($('#template-editbox').html(), that.model.toJSON())));

      that.bind('cancel', function() {
        that.close();
      })
      .$el.find('textarea')
        .bind('keydown', 'esc', function(e) {
          e.preventDefault();
          e.stopPropagation();
          that.trigger('cancel');
        })
        .bind('keydown', 'ctrl+s', function(e) {
          e.preventDefault();
          save_model(that.model);
          return false;
        })
        .bind('keydown', _.debounce(function(e){
          if(e.keyCode != 27) save_model(that.model);
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
        .resizable({
          handles: 'all'
        })
        // .animate({
        //   top: '+=15',
        //   left: '+=15'
        // })
        .find('textarea')
        .focus();
    },

    close: function() {
      this.$el.fadeOut(function(el) { $(el).remove(); });
    }

  });

  window.App = (new AppView({
    collection: new BlockList(blocks),
    model: new Page(page)
  })).render();


});






