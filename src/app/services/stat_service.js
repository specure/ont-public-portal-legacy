angular.module('nettestApp').service('statService', [
  '$http', '$filter', '$stateParams', 'MAIN',
  function($http, $filter, $stateParams, MAIN) {
    var URL_BASE = MAIN.SERVER.STATISTICS + '/';

    this.getNewestTests = function(amount, cursor) {
      var appendCursor = '';
      if (cursor) {
        appendCursor = '&cursor='+cursor;
      }
      return $http.get(URL_BASE + 'opentests/search?max_results=' + amount + appendCursor);
    };

    this.runAdvancedSearch = function(searchString, cursor) {
      var appendCursor = '';
      if (cursor) {
        appendCursor = '&cursor='+cursor;
      }
      var testStr = searchString;  // pre potreby volania STATservera, vraciam sa k time[]
      var res = testStr.replace('timeFrom=', 'time='+encodeURIComponent('>'));
      res = res.replace('timeTo=', 'time='+encodeURIComponent('<'));
      return $http.get(URL_BASE + 'opentests/search?' + res + appendCursor);
    };

    this.formatSearchResult = function(data) {
      var formatSpeedFilter = $filter('formatSpeed');
      angular.forEach(data, function(v, i) {
        v['download_kbit'] = formatSpeedFilter(v['download_kbit'], '-');
        v['upload_kbit'] = formatSpeedFilter(v['upload_kbit'], '-');
      });
    };

    this.runSearch = function(params) {
      return $http.post(URL_BASE + 'statistics', params);
    };

    this.getDefaultSearchParams = function() {
      //console.log(MAIN.DEFAULT_SEARCH_PARAMS);
      return MAIN.DEFAULT_SEARCH_PARAMS;
    };

    this.getDefaultStatisticsFilter = function() {
      return {
        'type': {
          'translate': 'stats._type',
          'type': 'select',
          'values': [
            {'translate': 'stats.type.mobile', 'value': 'mobile'},
            {'translate': 'stats.type.wifi', 'value': 'wifi'},
            {'translate': 'stats.type.browser', 'value': 'browser'}
          ]
        },
        'duration': {
          'translate': 'stats._time_span',
          'type': 'datepicker',
          'values': []
        },
        'metric': {
          'translate': 'stats._metric',
          'type': 'select',
          'values': [
            {'name': '20%', 'value': '0.2'},
            {'translate': 'median', 'value': '0.5'},
            {'name': '80%', 'value': '0.8'},
            {'translate': 'average', 'value': '-1.0'}
          ]
        },
        'network_type_group': {
          'translate': 'stats._cat_technology',
          'type': 'select',
          'values': [
            {'translate': 'stats.cat_technology.any', 'value':'all'},
            {'name': '2G', 'value':'2G'},
            {'name': '3G', 'value':'3G'},
            {'name': '4G', 'value':'4G'},
            {'name': '5G', 'value':'5G'}
          ]
        }
      };
    };
  }]);