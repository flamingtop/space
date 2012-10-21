window.BlockList = Backbone.Collection.extend(function(){
  if(config.local === true)
    return {
      model: Block,
      localStorage: new Store('page')
    };
  else
    return {
      model: Block,
      url: '/page/' + PAGE.id + '/blocks',
      initialize: function() {
        this
          .bind('reset', function(collection) {
            this.add_all(collection.models);
          }, this)
          .bind('add', function(model) {
            this.add_one(model);
          }, this);
      },
      add_one: function(model) {
        $('#page').append(model.view.render().$el);
      }, 
      add_all: function(models) {
        _.each(models, function(model) {
          this.add_one(model);
        }, this);
      }
    };
}(), {
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
