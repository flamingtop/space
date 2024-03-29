window.EditView = Backbone.View.extend({

  initialize: function() {
    this.setElement($(Mustache.render($('#template-editbox').html(), this.model.toJSON())));
    var that = this;
    that.$el.find('textarea')
      .bind('keydown', 'esc', function(e) {
        e.preventDefault();
        that.model.trigger('block:edit:end');
      })
      .bind('keydown', 'ctrl+s', function(e) {
        e.preventDefault();
        that.model.trigger('block:edit:save');
      })
      .bind('keydown', _.debounce(function(e){
        e.preventDefault();
        if(e.keyCode != 27)
          that.model.trigger('block:edit:save');
      }, 1000))
      .end().find('.close').click(function(){
        that.model.trigger('block:edit:end');
      });
  },


  render: function() {
    // already rendered
    if(this.rendered === true) {
      this.$el
        .fadeIn()
        .animate({top:'-=10'})
        .find('textarea')
        .focus();
      return;
    }

    // first time being rendered
    this.$el
      .appendTo($('body'))
      .draggable()
      .resizable({handles: 'all'})
      .animate({top: '-=10'})
      .find('textarea')
      .focus();
    this.rendered = true;
  },

  close: function() {
    this.$el
      .animate({top: '+=10'}, {
        complete: function() {
          $(this).find('textarea').blur();
          $(this).fadeOut();
        }
      });
  }

});
