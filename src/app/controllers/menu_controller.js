angular.module('nettestApp').controller('MenuController', [
  '$state', '$stateParams', '$translate', '$rootScope', '$window', 'userFactory', 'MAIN',
  function($state, $stateParams, $translate, $rootScope, $window, user, MAIN) {
    var vm = this;

    vm.lang = $stateParams.langcode;

    if (MAIN.LANGUAGES.findIndex(function (lang) { return vm.lang === lang.code; }) === -1) {
      $state.go($state.current.name, {
        langcode: MAIN.PREFERRED_LANGUAGE
      });

      return;
    }

    $translate.use(vm.lang);

    vm.userAgent = $window.navigator.userAgent;

    if (vm.lang === undefined || vm.lang === null) {
      vm.lang = $translate.use();
    }

    /*$rootScope.back = function() {
        // if previous state was test, then go back to index
        if ($rootScope.previousStateName === 'home.test') {
            $state.go('home.index');
        } else {
            $state.go($rootScope.previousStateName, $rootScope.previousStateParams);
        }
    };*/

    /**
         * changes the language of the app and broadcasts the event {handleLanguageChange} with the new language as parameter
         */
    this.changeLang = function(lang_code) {
      vm.lang = lang_code;
      user.setLanguage(vm.lang);

      $translate.use(vm.lang);

      $stateParams.langcode = vm.lang;
      $state.go($state.current, {'langcode': vm.lang}, {location: true, reload: false, notify: false}).then(function() {
        $rootScope.$broadcast('handleLanguageChange', vm.lang);
      });
    };

    if ($translate.use() != vm.lang) {
      $stateParams.langcode = $translate.use();
      $state.go($state.current, {'langcode': $translate.use()}, {location: true, reload: false, notify: false}).then(function() {
        $rootScope.$broadcast('handleLanguageChange', vm.lang);
      });
    }

    vm.toggleCookieWidget = e => {
      e.preventDefault();
      window.NTCookieService.isDialogOpen = true;
    };
  }]);
