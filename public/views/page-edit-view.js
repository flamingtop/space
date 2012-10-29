window.PageEditView = Backbone.View.extend({
  el: $('#page-edit-box'),
  initialize: function() {
    var that = this;
    that.$el.find('textarea').bind('keydown', 'esc', function(){
      that.model.trigger('page:edit:end');
    });
  },
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
