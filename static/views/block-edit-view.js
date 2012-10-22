$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

window.EditView = Backbone.View.extend({

  initialize: function() {
    var that = this;
    that.setElement($(Mustache.render($('#template-editbox').html(), that.model.toJSON())));
    that.$el.find('textarea')
      .bind('keydown', 'esc', function(e) {
        e.preventDefault();
        that.model.trigger('block:edit:end');
      })
      .bind('keydown', 'ctrl+s', function(e) {
        e.preventDefault();
        that.model.trigger('block:edit:save');
      })
      .bind('keydown', _.debounce(function(e) {
        var text = that.$el.find('textarea').val();
        var last_line = _.last(text.split("\n"));
        if(last_line.charAt(0) == ':') {
          var token = last_line.split(' ')[0].substr(1);

          if(-1 == $.inArray(token, ['css', 'tags', 'title', 'slug', 'type'])) return;

          var text = text.replace(':'+token, '<'+token+'></'+token+'>');
          that.$el.find('textarea').val(text);
          var caret_pos = text.length - (token.length + 3);
          that.$el.find('textarea').selectRange(caret_pos, caret_pos);
        }
      }, 500))
      .bind('keydown', _.debounce(function(e){
        if(e.keyCode == 27) return;
        that.model.trigger('block:edit:save');
      }, 1000));
    that.$el.find('.close').click(function(){
      that.model.trigger('block:edit:end');
    });
  },

  render: function() {
    // already rendered
    if(this.rendered === true) {
      this.$el
        .css({ top:  this.model.get('top')+'px',
               left: this.model.get('left')+'px' })
        .fadeIn()
        .animate({top:'-=10'},{
          complete: function() {
            $(this).find('textarea').focus();
          }
        })
      return;
    }
    // first time rendering
    this.$el
      .appendTo($('body'))
      .draggable()
      .resizable({handles: 'all'})
      .animate({top: '-=10'}, {duration: 1000})
      .find('textarea')
      .focus();
    this.rendered = true;
  },

  close: function() {
    this.$el
      .animate({top:'+=10'}, {
        complete: function() {
          $(this).find('textarea').blur();
          $(this).fadeOut();
        }
      })
  }

});
