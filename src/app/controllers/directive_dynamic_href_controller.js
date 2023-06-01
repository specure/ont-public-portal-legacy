angular.module('nettestApp').controller('DirectiveDynamicHrefController', ['$state', function($state) {
  var vm = this;
  this.getHref = function() {
    var href = $state.href(vm.state);
    var opt = vm.options();
    if (typeof opt === 'object') {
      href += '?';
      var index = 0;
      for (var o in opt) {
        href += (index++ > 0 ? '&' : '') + o + '=' + opt[o];
      }
    }
    else if(opt) {
      href += '?' + opt;
    }

    return href;
  };
}]);