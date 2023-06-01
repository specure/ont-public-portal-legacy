angular.module('nettestApp').controller('RecentTestsController', [
  '$scope', 'statService', '$translate',
  function($scope, statService, $translate) {
    var vm = this;

    //List sorting variable and class changer
    vm.listOrganizer = null;
    vm.activeCSSClass = null;

    vm.last5Tests = 5;
    vm.last10Tests = 10;
    vm.searchParams = statService.getDefaultSearchParams();
    //Glyph object for the class changer
    vm.chevronGlyphs = {
      ascending: 'fa fa-sort-up',
      descending: 'fa fa-sort-down',
      noFocus: 'fa fa-sort'
    };

    // Class assigner. New algorithm, a bit leaner that the previous implementation!
    vm.assignClass = function(list, glyph) {
      if (vm.activeCSSClass === null || vm.activeCSSClass !== list) {
        return glyph.noFocus;
      } else {
        return vm.listOrganizer.indexOf('-') === -1 ? glyph.ascending : glyph.descending;
      }
    };

    // Sorting method
    vm.organizeList = function(list) {
      vm.activeCSSClass = list;
      if (vm.listOrganizer === list) {
        //Descending order
        vm.listOrganizer = '-' + vm.listOrganizer;
      } else {
        vm.listOrganizer = list;
      }
    };

    this.runRecentTestsSearch = function(maxTests, cursor) {
      //load recent tests
      statService.getNewestTests(maxTests, cursor).then(
        function (data) {
          if (vm.recentTests && vm.recentTests['results']) {
            for (var i = 0; i < data.data.results.length; i++) {
              vm.recentTests['results'].push(data.data.results[i]);
            }
            vm.recentTests['next_cursor'] = data.data['next_cursor'];
          }
          else {
            vm.recentTests = data.data;
          }
        },
        function (error) {
          vm.recentTest = null;
          vm.error = error;
        });
    };

    this.activateMoreResults = function() {
      vm.showMore = true;
      $scope.$broadcast('onShowMoreResults');
    };

    this.formatStatTitle = function(item) {
      return (item['provider_name'] ? '' : item['provider_name'] + ', ') + item['model'] +
				(item['platform'] ? '' : ' (' + item['platform'] + ')');
    };

    $scope.$on('onShowMoreResults', function() {
      if (vm.showMore) {
        if (vm.recentTests && vm.recentTests['next_cursor']) {
          vm.runRecentTestsSearch(50, vm.recentTests['next_cursor']);
        }
        else {
          vm.runRecentTestsSearch(5);
        }
      }
    });
    //Call to runRecentTestsSearch populates the results array which is used to render the Statistics table with the last 10 tests. Subsequently this value can be changed and a filter limitTo:10 applied within the view to maintain the last 10 tests.
    vm.runRecentTestsSearch(10);
  }]);