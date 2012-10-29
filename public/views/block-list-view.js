window.BlockListView = Backbone.View.extend({
  el: $('#block-list-view'),
  initialize: function() {
    var that = this;
    this.opened = false;
    this.$el.find('li')
      .live('mouseenter', function(){
        $(this).addClass('hover');
        that.collection.getByCid($(this).attr('id')).trigger('block:focus');
      })
      .live('mouseleave', function(){
        $(this).removeClass('hover');
      })
      .live('click', function(e) {
        e.preventDefault();
        var block = that.collection.getByCid($(this).attr('id'));
        if(block.selected === true)
          block.trigger('block:deselect');
        else
          block.trigger('block:select');
      });
  },
  render: function() {
    this.$el.find('ul').empty();
    var items = Mustache.render($('#template-block-list-items').html(), {blocks:this.collection.models});
    this.$el.find('ul').html(items).show();
  }
});
