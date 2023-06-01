angular.module('nettestApp').controller('socialMediaController', ['socialMediaFactory', function(smFactory) {
  var vm = this;

  vm.encodeURL = function(url) {
    smFactory.encodeURL(url);
  };

  vm.testResultsURL = smFactory.testResultsURL;
  vm.testResultsEncodedURL = smFactory.encodeURL(smFactory.testResultsURL);
  vm.test = smFactory.test;
  vm.uuid = smFactory.test_uuid;
}]);