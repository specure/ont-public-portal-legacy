angular.module('nettestApp').controller('AlertManagerController', ['ngDialog', function (ngDialog) {
  this.ok = function(dialogId) {
    ngDialog.close(dialogId);
  };
}]);