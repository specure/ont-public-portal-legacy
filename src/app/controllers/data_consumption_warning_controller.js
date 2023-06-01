angular.module('nettestApp').controller('DataConsumptionWarningController', [
  '$translate', '$rootScope', 'ngDialog', '$state',
  function($translate, $rootScope, ngDialog, $state) {

    this.ok = function(dialogId) {
      ngDialog.close(dialogId);
      $rootScope.$broadcast('dataConsumptionWarningAccepted', true);
    };

    this.cancel = function(dialogId) {
      ngDialog.close(dialogId);
      $state.go('home.index');
    };

    this.getLang = function() {
      return $translate.use();
    };
  }]);