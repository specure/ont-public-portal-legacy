angular.module('nettestApp').controller('TestSearchController', [
  '$scope', '$rootScope', '$location', '$httpParamSerializer', '$stateParams', 'ngDialog' ,'statService', 'userFactory', '$filter', 'countryService', '$timeout', '$q',
  'advancedSearchService', 'cfpLoadingBar', '$translate', 'localizationService',
  function($scope, $rootScope, $location, $httpParamSerializer, $stateParams, ngDialog ,statService, userService, $filter, countryService, $timeout, $q,
    advancedSearchService, cfpLoadingBar, $translate, localizationService) {

    var vm = this;
    var titleFilter = $filter('formatOpentestTitle');

    vm.searchParams = advancedSearchService.unpackParams($location.search());
    vm.options = advancedSearchService.getOptions();
    vm.search = {};

    var queryParams = $location.search();

    var SIMPLE_SEARCH_FIELDS = [ 'cat_technology', 'network_country', 'time' ];

    vm.showFilter = getInitFilter(queryParams);

    // Daterangepicker parameters and configuration
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
    vm.searchParams['time'] = {
      startDate: moment(+queryParams.timeFrom || moment().subtract(29, 'day')).startOf('day').locale($translate.use()),
      endDate: moment(+queryParams.timeTo || undefined).endOf('day').locale($translate.use())
    };
    $translate(datepickerIntervals).then(function(transl) {
      vm.date_input_options = localizationService.updateIntervalLocale(transl);
    });
    vm.showMoreResults = function() {
      if (vm.search && vm.search['next_cursor']) {
        vm.runAdvancedSearch(false, vm.search['next_cursor']);
      } else {
        vm.runAdvancedSearch(false);
      }
    };

    vm.triggerFilterType = function () {
      vm.showFilter = !vm.showFilter;
      if (!vm.showFilter) {
        resetFilterSettings();
      }
    };

    function getInitFilter (queryParams) {
      // remove all possible parametrs of simple search => if something left (besides dates) - advanced search
      // server return 400 after adding 'searchType' query parameter
      for (var i = 0; i < SIMPLE_SEARCH_FIELDS.length; i++) {
        delete queryParams[SIMPLE_SEARCH_FIELDS[i]];
      }
      return Object.keys(queryParams).length > 2;
    }

    function resetFilterSettings() {
      var initSearch = {};
      for (var i = 0; i < SIMPLE_SEARCH_FIELDS.length; i++) {
        initSearch[SIMPLE_SEARCH_FIELDS[i]] = vm.searchParams[SIMPLE_SEARCH_FIELDS[i]];
      }
      vm.searchParams = initSearch;
    }

    vm.runAdvancedSearch = function(clearOldResults, cursor) {
      $location.search({});
      var params = advancedSearchService.packParamsToString(vm.searchParams);
      if (clearOldResults) {
        vm.search = null;
      }

      $location.search(params);

      statService.runAdvancedSearch(params, cursor).then(
        function (data) {
          statService.formatSearchResult(data.data.results);
          angular.forEach(data.data.results, function(v, i) {
            v['_title'] = titleFilter(v);
            v['_ping_ms'] = v['ping_ms'].toFixed(0);
          });

          if (vm.search && vm.search['results']) {
            for (var i = 0; i < data.data.results.length; i++) {
              vm.search['results'].push(data.data.results[i]);
            }
            vm.search['next_cursor'] = data.data['next_cursor'];
          }
          else {
            vm.search = data.data;
          }
        },
        function (error) {
          vm.search = null;
        });
    };

    vm.clearSearch = function() {
      vm.searchParams = {};

      // TOTO - search params RESET
      vm.runAdvancedSearch(false);
    };

    $scope.$on('handleLanguageChange', function(newLang) {
      $translate(datepickerIntervals).then(function(transl) {
        vm.date_input_options = updateIntervalLocale(transl);
      });
      $location.search(advancedSearchService.packParamsToString(vm.searchParams));

      vm.options['network_country']['options'] = countryService.getCountriesObject();
      vm.options['sim_country']['options'] = countryService.getCountriesObject();
      vm.options['country_geoip']['options'] = countryService.getCountriesObject();
    });

    $scope.$on('$viewContentLoaded', function() {
      $scope.$applyAsync(function() {
        angular.forEach(vm.options, function(v, key) {

          if (v.type == 'date') {
            vm.initDateFilter(key, v);
          }
        });
        vm.runAdvancedSearch(true);
      });
    });
  }]);