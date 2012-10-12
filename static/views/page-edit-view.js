window.PageEditView = Backbone.View.extend({
  el: $('#page-edit-box'),
  show: function() {
    this.$el.animate({
      top: '-10px'
    }, {
      duration: 500
    });
  },
  hide: function() {
    this.$el.animate({
      top: '-1000px'
    }, {
      duration: 500
    });
  }
});
