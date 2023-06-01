angular.module('nettestApp').controller('HomeController', [
  '$state', '$stateParams', '$translate', 'userFactory', 'advertisedSpeedDataService', 'MAIN',
  function($state, $stateParams, $translate, userService, advertisedSpeedDataService, MAIN) {
    var vm = this;
    vm.lang = $stateParams.langcode;

    userService.getSettings(function (data) {
      vm.settings = data;
    });

    this.startTest = function() {
      //if advertised speed option is activated, run control trigger:
      if (vm.set_adv_speed && MAIN.FEATURES.ADVERTISED_SPEED_OPTION.enabled && vm.settings.settings[0]['advertised_speed_option']) {
        var id = vm.adv_spd.technology;
        if (id === null || id === '-1') {
          vm.adv_spd.technology_obj = {uid: null, name: 'unknown'};
        } else {
          var tech = vm.settings.settings[0]['advertised_speed_option'][vm.adv_spd.technology];
          vm.adv_spd.technology_obj = tech;
        }
        advertisedSpeedDataService.checkOptions(vm.adv_spd, function failFunc(fail) {
          vm.adv_spd.fail = fail;
        });

        advertisedSpeedDataService.setAdvertisedSpeedData(vm.adv_spd);
      }

      if ((vm.adv_spd && (!vm.adv_spd.fail || !vm.adv_spd.fail.error)) || !vm.adv_spd) {
        $state.go('home.test');
      }
    };
  }]);