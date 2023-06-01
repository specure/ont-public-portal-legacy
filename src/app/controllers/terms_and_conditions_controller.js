angular.module('nettestApp').controller('TermsAndConditionsController', [
  '$translate', '$rootScope', 'userFactory', 'ngDialog', '$state',
  function($translate, $rootScope, userService, ngDialog, $state) {

    this.ok = function(dialogId) {
      ngDialog.close(dialogId);
      userService.setTCAccepted(true);
      userService.getSettings(
        function (success) {
          $rootScope.$broadcast('termsAndConditionsAccepted', true);
        });
    };

    this.cancel = function(dialogId) {
      ngDialog.close(dialogId);
      userService.setTCAccepted(false);
      $state.go('home.index');
    };

    this.getLang = function() {
      return $translate.use();
    };
  }]);