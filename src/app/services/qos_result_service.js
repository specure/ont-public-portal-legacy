angular.module('nettestApp').service('qosResultService', [
  '$http', '$stateParams', 'MAIN',
  function($http, $stateParams, MAIN) {
    var URL_BASE = MAIN.SERVER.CONTROL + '/qos/';

    this.getQoSTest = function(openTestUuid, successFunc, failureFunc) {
      $http.get(URL_BASE + openTestUuid + '/' + $stateParams.langcode).then(
        function(data) {
          if (successFunc) {
            successFunc(data.data);
          }
        },
        function(error) {
          if (failureFunc) {
            failureFunc(error);
          }
        });
    };
  }]);