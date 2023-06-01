angular.module('nettestApp').controller('StatsController', [
  '$stateParams', '$translate', 'statService', 'countryService', 'MAIN', '$location', 'localizationService',
  function($stateParams, $translate, statService, countryService, MAIN, $location, localizationService) {
    var vm = this;

    vm.countryService = countryService;
    vm.searchParams = statService.getDefaultSearchParams();
    vm.filter = statService.getDefaultStatisticsFilter();
    vm.isHidden = title => title === 'network_type_group' && vm.searchParams.type === 'wifi';
    vm.resetTechnology = title => {
      if (title !== 'type') {
        return;
      }
      if (vm.searchParams.type !== 'wifi') {
        vm.searchParams.network_type_group = statService.getDefaultSearchParams().network_type_group;
      } else {
        vm.searchParams.network_type_group = 'all';
      }
    };
    vm.searchResult = {};
    vm.sortedDesc = null;
    vm.activeClass = null;
    vm.MAIN = MAIN;
    vm.filterProviders = 'name';  //default sort providers by name [NTW-119]

    // Daterangepicker parameters and configuration
    var queryParams = $location.search();
    var datepickerIntervals = [
      'datetime.yesterday',
      'datetime.last_7_days',
      'datetime.today',
      'datetime.this_month',
      'datetime.last_month',
      'datetime.last_30_days',
      'datetime.custom_range',
      'datetime.apply',
      'datetime.cancel'
    ];
    vm.searchParams['duration'] = {
      startDate: moment(+queryParams.timeFrom || moment().subtract(2, 'year')).startOf('day').locale($translate.use()),
      endDate: moment(+queryParams.timeTo || undefined).endOf('day').locale($translate.use())
    };
    $translate(datepickerIntervals).then(function(transl) {
      vm.date_input_options = localizationService.updateIntervalLocale(transl);
    });

    //Class function to replace icons based on the filter order.
    vm.activateClass = function(activatedClass) {
      var activeClass = null;
      if (vm.activeClass === null || vm.activeClass !== activatedClass) {
        activeClass = 'fa fa-sort';
      } else if (vm.activeClass === activatedClass) {
        activeClass = vm.sortedDesc ? 'fa fa-sort-up' : 'fa fa-sort-down';
      }
      return activeClass;
    };

    //Should create separate controllers otherwise it's a mess!
    vm.organizeProviders = function(variableToFilter) {
      vm.activeClass = variableToFilter + 'prov';
      if (vm.sortedDesc === null) {
        vm.sortedDesc = true;
      } else if (vm.sortedDesc) {
        variableToFilter = '-' + variableToFilter;
      }
      // Change the property to false so when checked gain returns a descending list
      vm.sortedDesc = !vm.sortedDesc;
      vm.filterProviders = variableToFilter;
    };

    //Should create separate controllers otherwise it's a mess!
    vm.organizeDevices = function(variableToFilter) {
      vm.activeClass = variableToFilter + 'dev';
      if (vm.sortedDesc === null) {
        vm.sortedDesc = true;
      } else if (vm.sortedDesc) {
        variableToFilter = '-' + variableToFilter;
      }
      // Change the property to false so when checked gain returns a descending list
      vm.sortedDesc = !vm.sortedDesc;
      vm.filterDevices = variableToFilter;
    };
    this.runSearch = function() {

      statService.runSearch(vm.searchParams).then(
        function (data) {
          vm.searchResult = data.data;
        },
        function (error) {
          vm.searchResult = null;
          vm.error = error;
        }
      );
    };

    if (!MAIN.FEATURES.STATISTICS_COUNTRY) {
      vm.operatorCountries = { countries: countryService.getCountries() };
    }
  
    vm.runSearch();
  }]);
