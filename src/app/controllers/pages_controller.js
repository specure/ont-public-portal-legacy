angular.module('nettestApp').controller('PagesController', ['$state', function ($state) {
  var vm = this;
  var cuttedFooterPages = ['home.index', 'home.map', 'home.map_new', 'home.map_old'];
  vm.getCurrentPageFooterType = function () {
    return ~cuttedFooterPages.indexOf($state.current.name) ? 'cutted' : 'default';
  };

  var pagesWithoutClass = ['home.history', 'home.privacy_policy'];

  vm.getCurrentPageClass = function () {
    return ~pagesWithoutClass.indexOf($state.current.name) ? '' : 'height-adjust';
  };


}]);