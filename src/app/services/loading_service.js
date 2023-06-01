angular.module('nettestApp').service('loadingService', function() {
  var counter = 0;
  this.show = function(amount) {
    if (counter <= 0) {
      counter = 0;
      // add the overlay with loading image to the page
      var over = '<div id=\'loading-overlay\' class=\'overlay\'>' +
					'<img class=\'overlay loading\' src=\'assets/img/loader.gif\' />' +
					'</div>';
      $(over).appendTo('body');
    }
    counter+=(amount!==undefined ? amount : 1);
  };

  this.hide = function() {
    if (--counter <= 0) {
      $('#loading-overlay').remove();
    }
  };
});