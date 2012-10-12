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
