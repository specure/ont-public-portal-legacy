angular.module('nettestApp')
  .controller('HistoryController', ['$scope', '$filter', '$state', 'userFactory', '$translate', 'ngDialog', 'MAIN', '$cookies', '$rootScope', function($scope, $filter, $state, userService, $translate, ngDialog, MAIN, $cookies, $rootScope) {
    var vm = this;

    vm.isHistoryAllowed = null;
    vm.isIE = navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1;

    const pathParts = window.location.pathname.split('/');
    translateWarning(pathParts[1]);

    vm.checkIsCookieAllowed = function () {
      if (!window.NTCookieService || !window.NTCookieService.isCookieAccepted) {
        return;
      }
      window.NTCookieService.isCookieAccepted('functional').then(function (allowed) {
        console.log("Cookie RMBTuuid allowed?", allowed);
        vm.isHistoryAllowed = allowed;
        window.isHistoryAllowed = allowed;
        if (!allowed) {
          localStorage.removeItem('RMBTuuid');
        }
        $scope.$apply();
      });
    };

    vm.eventHandlersSet = false;
    vm.setCookieEventHandlers = function () {
      if (!window.NTCookieService || !window.NTCookieService.addEventListener || vm.eventHandlersSet) {
        return;
      }
      window.NTCookieService.addEventListener('consentUpdated', () => {
        vm.checkIsCookieAllowed();
      });
      vm.eventHandlersSet = true;
    };

    if (MAIN.FEATURES.COOKIE_WIDGET && MAIN.FEATURES.COOKIE_WIDGET.ENABLED) {
      vm.checkIsCookieAllowed();
      vm.setCookieEventHandlers();
      $rootScope.$on('cookieServiceReady', () => {
        vm.checkIsCookieAllowed();
        vm.setCookieEventHandlers();
      });
    } else {
      vm.isHistoryAllowed = true;
    }

    var dateFilter = $filter('formatLocaleDate');

    vm.userService = userService;

    vm.showTest = function(testUuid) {
      $state.go('home.historytest', {'testuuid': testUuid});
    };

    vm.requestSyncCode = function() {
      userService.requestSyncCode(
        function(data) {
          console.log(data);
          if (data['sync'] && data['sync'][0] && data['sync'][0]['sync_code']) {
            vm.syncCodeRequest = data['sync'][0]['sync_code'];
          }
          else {
            vm.syncCodeRequest = null;
          }
        },
        function(error) {
          console.log(error);
          vm.syncCodeRequest = null;
        });
    };

    vm.sendSyncCode = function() {
      if (!vm.syncCode) {
        $translate('history._sync_code_wrong').then(function(translation) {
          let template = '<h3>' + translation + '</h3>' + '<div class=\'ngdialog-buttons\'><button class=\'ngdialog-button ngdialog-button-primary\' data-ng-click=\'amctrl.ok(ngDialogId)\'>OK</button></div>';
          ngDialog.open({
            template: template,
            plain: true,
            controller: 'AlertManagerController',
            controllerAs: 'amctrl'
          });
          vm.syncResponse = translation;
        });
      }
      if (vm.syncCode === vm.syncCodeRequest) {
        $translate('history._sync_code_same').then(function(response) {
          console.log(response);
          let template = '<h3>' + response + '</h3>' + '<div class=\'ngdialog-buttons\'><button class=\'ngdialog-button ngdialog-button-primary\' data-ng-click=\'amctrl.ok(ngDialogId)\'>OK</button></div>';
          ngDialog.open({
            template: template,
            plain: true,
            controller: 'AlertManagerController',
            controllerAs: 'amctrl'
          });
        });
      } else {
        userService.sendSyncCode(vm.syncCode,
          function (data) {
            console.log(data);
            if (!data.error[0]) {
              vm.syncResponse =  data;
            } else {
              let template = '<h3>' + data.error[0] + '</h3>' + '<div class=\'ngdialog-buttons\'><button class=\'ngdialog-button ngdialog-button-primary\' data-ng-click=\'amctrl.ok(ngDialogId)\'>OK</button></div>';
              ngDialog.open({
                template: template,
                plain: true,
                controller: 'AlertManagerController',
                controllerAs: 'amctrl'
              });
            }
            console.log(vm.syncResponse);
            $scope.$applyAsync(function() {
              vm.requestHistory();
            });
          },
          function (error) {
            console.log(error);
            vm.syncResponse = null;
            $translate('history._sync_code_wrong').then(function success(response) {
              console.log(response);
              let template = '<h3>' + response + '</h3>' + '<div class=\'ngdialog-buttons\'><button class=\'ngdialog-button ngdialog-button-primary\' data-ng-click=\'amctrl.ok(ngDialogId)\'>OK</button></div>';
              ngDialog.open({
                template: template,
                plain: true,
                controller: 'AlertManagerController',
                controllerAs: 'amctrl'
              });
            });
          });
      }
    };

    vm.requestHistory = function() {
      userService.requestHistory(
        function(data) {
          console.log(data);
          var showErrorModal = false;
          if (showErrorModal && data.error[0]) {
            let template = '<h3>' + data.error[0] + '</h3>' +
              '<div class=\'ngdialog-buttons\'><button class=\'ngdialog-button ngdialog-button-primary\' data-ng-click=\'amctrl.ok(ngDialogId)\'>OK</button></div>';
            ngDialog.open({
              template: template,
              plain: true,
              controller: 'AlertManagerController',
              controllerAs: 'amctrl'
            });
          }
          if (data && data.history) {
            angular.forEach(data.history, function(v, i) {
              v['_time'] = dateFilter(new Date(parseInt(v['time'],10)));
            });
          }

          vm.search = data;
        },
        function() {
          vm.search = null;
        });
    };

    $scope.$on('handleLanguageChange', function(_, lang) {
      if (vm.search && vm.search.history) {
        angular.forEach(vm.search.history, function(v, i) {
          v['_time'] = dateFilter(new Date(parseInt(v['time'],10)));
        });
      }
      translateWarning(lang);
    });

    $scope.$on('termsAndConditionsAccepted', function(isAccepted) {
      if (isAccepted) {
        vm.requestHistory();
      }
    });

    function translateWarning(lang) {
      const methodologyLangs = ['en', 'sk'];
      if (!~methodologyLangs.indexOf(lang)) {
        return;
      }
      $translate('history._warning_ie_link').then(function(fragment) {
        vm.warning_ie_link = window.location.protocol+'//'+window.location.host+'/'+lang+'/methodology#'+fragment;
      });
    }
  }]);
