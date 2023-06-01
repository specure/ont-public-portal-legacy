angular.module('nettestApp').controller('CustomerController', [
  '$state', '$scope', '$log', 'MAIN', 'MAP', 'VERSION', 'userFactory', 'advSearchService', '$location', '$cookies', 'cookieWidgetService', 'analyticsService',
  function($state, $scope, $log, MAIN, MAP, VERSION, userFactory, advSearchService, $location, $cookies, cookieWidgetService, analyticsService) {
    const noWidgetCustomers = ['NETTEST'];
    if (noWidgetCustomers.indexOf(MAIN.CUSTOMER_ID) > -1) {
      document.body.classList.add('no-widget');
    } 
    var vm = this;
    if ($location.host() === 'localhost') {
      vm.favURL = 'http://localhost:3000/assets/img/favicon.ico';
      vm.favURL16 = 'http://localhost:3000/assets/img/favicon-32x32.ico';
      vm.favURL32 = 'http://localhost:3000/assets/img/favicon-16x16.ico';
    } else {
      vm.favURL = 'https://' + $location.host() + '/assets/img/favicon.ico' ;
      vm.favURL16 = 'https://' + $location.host() + '/assets/img/favicon-16x16.ico' ;
      vm.favURL32 = 'https://' + $location.host() + '/assets/img/favicon-32x32.ico' ;
    }

    var queryParams = $location.search();

    vm.isMenuVisible = queryParams.menu !== 'false';

    vm.COOKIES_POLICY = userFactory.getCookies('cookies_policy');
    vm.acceptCookies = function() {
      userFactory.acceptCookiesPolicy();
    };

    vm.MAIN = MAIN;
    vm.MAP = MAP;
    vm.VERSION = VERSION;
    const storedLoopMode = $cookies.getObject('LoopMode');
    vm.loopMode = storedLoopMode || userFactory.loopMode;
    vm.loopModeAbort = userFactory.loopModeAbort;

    // Advanced search
    $scope.advSearch = userFactory.advSearch;
    vm.technologyOptions = advSearchService.getTechnologyOptions();

    vm.updateSizes = function () {
      setTimeout(function () {
        dispatchReizeEvent();
      }, 100);
    };

    vm.startTest = function () {
      if (MAIN.FEATURES.ADVERTISED_SPEED_OPTION.enabled && $scope.advSearch.enabled) {
        var validation = advSearchService.validate($scope.advSearch.technology, $scope.advSearch.up, $scope.advSearch.down);

        if (validation.state === false) {
          $scope.advSearch.fail = validation.fail;

          return;
        }
      }

      $state.go('home.newtest');
    };

    vm.onChangeLoopMode = function() {
      $cookies.putObject('LoopMode', vm.loopMode);
    };

    cookieWidgetService.initWidget();
    analyticsService.initAnalytics();
  }]);
