angular.module('nettestApp').service('errorHandlerService', function() {
  var error = {};

  this.getError = function() {
    return error;
  };

  this.clear = function() {
    error = {};
  };

  this.addError = function(cat, errObj) {
    if (!error[cat]) {
      error[cat] = [];
    }

    if (angular.isArray(errObj)) {
      angular.forEach(errObj, function(v, i) {
        error[cat].push({time: new Date().toLocaleTimeString(), msg: v});
      });
    }
    else {
      error[cat].push({time: new Date().toLocaleTimeString(), msg: errObj});
    }
  };
});