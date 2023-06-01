/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// init backwards compatibility:
Math.log10 = Math.log10 || function(x) {
  return Math.log(x) / Math.LN10;
};

angular.lowercase = function (s) {
  return s.toLowerCase();
};

angular.uppercase = function (s) {
  return s.toUpperCase();
};

var dateQueryString = function(key, value) {
/*	var d = new Date(value);
	var dateTo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
	var dateFrom = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
	var dateToWrapper = moment(dateTo);
	var dateFromWrapper = moment(dateFrom);
	var dateToStr = dateToWrapper.format('YYYY-MM-DD');
	var dateFromStr = dateFromWrapper.format('YYYY-MM-DD');
	//dateFrom.setDate(dateFrom.getDate() - 1);
	console.log('dateQueryString: '+value);
	console.log('dateTo: '+dateTo);
	console.log('dateToWrapper: '+dateToWrapper);
	console.log('dateToStr: '+dateToStr);
	var dateFrom = moment(value).startOf('day');
	var dateTo = moment(value).endOf('day');
	var dateFromStr = dateFrom.format('YYYY-MM-DD HH:mm:ss');
	var dateToStr = dateTo.format('YYYY-MM-DD HH:mm:ss');
*/
  return key + 'From=' + value.startDate + '&' + key + 'To=' + value.endDate;
};

/**
 * bit/sec to log10
 * @param  {number} value bit/sec
 * @return {number}       log10
 */
var speedToLog = function(value) {
  if (value < 1e5) {
    return 0;
  }
  return (2 + Math.log10(value / 1e7)) / 4;
};

var logToSpeed = function(value) {
  return (Math.pow(10, 4 * value + 5));
};
/*
  var app = angular.module('RedirectURLApp', []);
    app.controller('RedirectURLCtrl', function($scope, $window) {
      $scope.name = 'Anil';
      $scope.RedirectToURL = function() {
        var host = $window.location.host;
        var landingUrl = 'http://' + host + '/code-sample.com';
        alert(landingUrl);
        $window.location.href = landingUrl;
      };
    });
*/

navigator.browserSpecs = (function(){
  var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if(/trident/i.test(M[1])){
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return {name:'IE',version:(tem[1] || '')};
  }
  if(M[1]=== 'Chrome'){
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if(tem != null) {
      return {name:tem[1].replace('OPR', 'Opera'),version:tem[2]};
    }
  }
  M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
  if((tem = ua.match(/version\/(\d+)/i))!= null) {
    M.splice(1, 1, tem[1]);
  }
  return {name:M[0], version:M[1]};
})();

var nettestApp = angular.module('nettestApp', ['ui.router', 'templates-app', 'templates-customer', 'pascalprecht.translate', 'ngCookies', 'wt.responsive',
  'angular-loading-bar', 'ngAnimate', 'n3-line-chart', 'ngDialog', 'moment-picker', 'daterangepicker', 'angularjs-dropdown-multiselect'])

  /**********************************
		CONFIG
	***********************************/

  .config(['$provide', function ($provide) {
    $provide.decorator('$log', ['$delegate', 'PROFILE', function ($delegate, PROFILE) {

      try {
        if (log) {
          // fallback
          logger = log.noConflict() || console;
        }

        logger.setLevel(PROFILE.LOG_LEVEL);
      } catch (e) {
        return $delegate; // fall back to built-in angular logger
      }

      // log current profile if on dev
      logger.debug(PROFILE);

      return logger;
    }]);
  }])

  .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', '$translateProvider', '$httpProvider', 'cfpLoadingBarProvider', 'MAIN',
    function($stateProvider, $locationProvider, $urlRouterProvider,	$translateProvider, $httpProvider, cfpLoadingBarProvider, MAIN) {

      cfpLoadingBarProvider.includeBar = true;
      cfpLoadingBarProvider.includeSpinner = false;
      cfpLoadingBarProvider.latencyThreshold = 50;
      MAIN.FEATURES.INITIAL_HOME_SCREEN = !MAIN.FEATURES.INITIAL_HOME_SCREEN ? '' : MAIN.FEATURES.INITIAL_HOME_SCREEN;

      $urlRouterProvider.otherwise('/' + MAIN.PREFERRED_LANGUAGE + '/' + angular.lowercase(MAIN.FEATURES.INITIAL_HOME_SCREEN));
      $stateProvider
        .state('home', {
          url: '/:langcode',
          templateUrl: 'views/menu.html',
          abstract: true,
          controller: 'MenuController as menuctrl',
          resolve: {
            languageResolver: ['$stateParams', '$q', '$translate', function($stateParams, $q, $translate) {
              var deferred = $q.defer();
              var language = $stateParams.langcode;

              $translate.use(language).then(function() {
                deferred.resolve();
              }, function(error) {
                $translate.use(MAIN.PREFERRED_LANGUAGE).then(function() {
                  deferred.resolve();
                });
              });

              return deferred.promise;
            }]
          }
        });
      // Change default home screen based on customer needs.
      if (MAIN.FEATURES.INITIAL_HOME_SCREEN !== '') {
        $stateProvider
          .state('home.index', {
            url: '/',
            // Does not work if the page doesn't have a controller. Should refactor to take that into account.
            templateUrl: 'views/' + angular.lowercase(MAIN.FEATURES.INITIAL_HOME_SCREEN) + '.html',
            controller: MAIN.FEATURES.INITIAL_HOME_SCREEN + 'Controller as ' + angular.lowercase(MAIN.FEATURES.INITIAL_HOME_SCREEN) + 'ctrl'
          });

      } else {
        // Default to Map view
        $stateProvider
          .state('home.index', {
            url: '/',
            templateUrl: 'views/map.html',
            controller: 'MapController as mapctrl'
          });
      }
      //
      $stateProvider.state('home.perform_test', {
        url: '/perform_test',
        templateUrl: 'views/home.html',
        controller: 'HomeController as homectrl'
      })
        .state('home.newtest2', {
          url: '/newtest2',
          templateUrl: 'views/newtest2.html',
          controller: 'NewTest2Controller as newtest2ctrl'
        })
      // New Gauge + 1Gbit library
        .state('home.newtest' , {
          url: '/newtest/:userUUID',
          templateUrl: 'views/newtest.html',
          controller: 'NewTestController as newtestctrl',
          params: {
            isLoopIteration: false
          }
        })
      // Old testing framework
      // Should remove at a later time
      /*
			.state('home.test', {
				url: '/test',
				templateUrl: 'views/test.html',
				controller: 'TestController as testctrl'
			})
			*/

        .state('home.map', {
          url: '/map',
          templateUrl: 'views/map.html',
          controller: 'MapController as mapctrl'
          //				templateUrl: 'views/home.html',
          //				controller: 'HomeController as homectrl'

        })
        .state('home.map_new', {
          url: '/map',
          templateUrl: 'views/map.html',
          controller: 'MapController as mapctrl'

        })
        .state('home.history', {
          url: '/history',
          templateUrl: 'views/history.html',
          controller: 'HistoryController as historyctrl'
        })
        .state('home.historytest', {
          url: '/history/:testuuid',
          templateUrl: 'views/testresult.html',
          controller: 'TestResultController as resultctrl'
        })
        .state('home.help', {
          onEnter: [function() {
            // Removing footer for methodology fixed TOC sidebar .
            document.getElementsByClassName('footer-container')[0].style.display = 'none';
          }],
          onExit: [function() {
            document.getElementsByClassName('footer-container')[0].style.display = '';
          }],
          url: '/help',
          templateUrl: 'views/help.html'
        })
        .state('home.tc', {
          url: '/tc',
          templateUrl: 'views/tc.html'
        })
      // <organization> menu
        .state('home.java_cli', {
          url: '/java_cli',
          templateUrl: 'views/java_cli.html'
        })
        .state('home.privacy_policy', {
          url: '/pp',
          templateUrl: 'views/pp.html'
        })
        .state('home.terms_of_use', {
          url: '/tc',
          templateUrl: 'views/tc.html'
        })
      // <organization> menu END
        .state('home.about', {
          url: '/about',
          templateUrl: 'views/about.html'
        })
        .state('home.install', {
          url: '/install',
          templateUrl: 'views/install.html',
          controller: 'AppDownloadController as appdlctrl'
        })
        .state('home.cookies', {
          url: '/cookies',
          templateUrl: 'views/cookies.html'
        })
        .state('home.methodology', {
          onEnter: [function() {
            // Removing footer for methodology fixed TOC sidebar .
            document.getElementsByClassName('footer-container')[0].style.display = 'none';
          }],
          onExit: [function() {
            document.getElementsByClassName('footer-container')[0].style.display = '';
          }],
          url: '/methodology',
          templateUrl: 'views/methodology.html'
        })
        .state('home.wizard', {
          url: '/wizard',
          templateUrl: 'views/wizard.html'
        })
      ;


      var reportsUrl = MAIN.FEATURES.OPENDATA.IS_OPENDATA_ENABLED ? '' : '/reports';

      $stateProvider
        .state('home.stats', {
          url: reportsUrl + '/statistics',
          templateUrl: 'views/stats.html',
          controller: 'StatsController as stats'
        })
        .state('home.search', {
          url: reportsUrl + '/search',
          templateUrl: 'views/search.html',
          controller: 'TestSearchController as searchctrl'
        })
        .state('home.opentest', {
          url: reportsUrl + '/opentest/:opentestuuid',
          templateUrl: 'views/testresult.html',
          controller: 'TestResultController as resultctrl'
        })
        .state('home.opendata', {
          url: reportsUrl + (MAIN.FEATURES.OPENDATA.IS_OPENDATA_ENABLED ? '/opendata' : '/export'),
          templateUrl: 'views/opendata.html',
          controller: 'OpenDataController as opendatactrl'
        });

      if (!MAIN.FEATURES.OPENDATA.IS_OPENDATA_ENABLED) {
        $stateProvider
          .state('home.reports', {
            url: reportsUrl + '/index',
            templateUrl: 'views/reports.html',
            controller: 'ReportsController as reportsctrl'
          });
      }

      $locationProvider.html5Mode(true).hashPrefix('!');

      $translateProvider.useStaticFilesLoader({
        prefix: 'assets/lang/lang_',
        suffix: '.json'
      });

      $translateProvider.useSanitizeValueStrategy('escape');
      $translateProvider.preferredLanguage(MAIN.PREFERRED_LANGUAGE);
      $translateProvider.usePostCompiling(true);

      $httpProvider.interceptors.push('httpRequestInterceptor');
      $httpProvider.defaults.timeout = 15000;
    }])

  /**********************************
		RUN
	***********************************/

  .run(['$rootScope', '$translate', '$window', '$timeout', 'cfpLoadingBar', function($rootScope, $translate, $window, $timeout, cfpLoadingBar) {
    $rootScope.stateIsLoading = true;

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      $rootScope.stateIsLoading = false;
    });

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      $rootScope.start = new Date().getTime();
      $rootScope.stateIsLoading = true;

      //undbing scroll event on state change...
      var $w = angular.element($window);
      $w.unbind('scroll');

      $translate.use(toParams['langcode']);
      /*
			if (fromParams['langcode'] !== toParams['langcode']) {
				$translate.use(toParams['langcode']);
			}
			*/
    });
  }])

  /**********************************
		FACTORIES
	***********************************/

  /**
	 * Factory for user management (uuid, terms&conditions accepted, settings request, data collector request, etc.)
	 */
  .factory('userFactory', ['$cookies', '$http', '$translate', '$filter', '$interval', '$state', 'MAIN', 'advSearchService', function($cookies, $http, $translate, $filter, $interval, $state, MAIN, advSearchService) {
    var settings = null;

    function acceptCookiesPolicy() {
      $cookies.put('cookies_policy', true);
      angular.element('div.cookies-policy').addClass('ng-hide');
      COOKIES.COOKIES_POLICY = true;
    }

    var minimumInterval = MAIN.FEATURES.LOOP_MODE_MIN_INTERVAL || 60;

    var loopMode = {
      isEnabled: false,
      repetitions: 0,
      intervalMinutes: minimumInterval,
      finishedTestsCount: 0,
      remainingTestsCount: 0,
      countdown: {
        seconds: '',
        minutes: '',
        hours: ''
      }
    };

    function loopModeNext() {
      // Detect first call
      if(loopMode.finishedTestsCount === 0) {
        if(loopMode.intervalMinutes < 0) {
          loopMode.intervalMinutes = 0;
        } else if (loopMode.intervalMinutes < minimumInterval) {
          //Overrides user set value if bellow 60 minutes.
          loopMode.intervalMinutes = minimumInterval;
        }
        if(loopMode.repetitions > 0) {
          // Linter complaining for missing radix.
          loopMode.remainingTestsCount = parseInt(loopMode.repetitions, 10) + 1;
        }
      }

      loopMode.finishedTestsCount++;
      if(loopMode.repetitions > 0) {
        loopMode.remainingTestsCount--;
        if(loopMode.remainingTestsCount === 0) {
          loopModeAbort();
        }
      }

      loopModeCountdownStart();
    }

    function loopModeAbort() {
      loopMode.isEnabled = false;
      loopMode.finishedTestsCount = 0;
      loopMode.remainingTestsCount = 0;
      if(loopModeCountdownInterval) {
        $interval.cancel(loopModeCountdownInterval);
        loopModeCountdownInterval = null;
      }
    }

    var loopModeCountdownInterval = null;
    var loopModeCountdownStartDate = null;
    function loopModeCountdownStart() {
      if(loopMode.isEnabled) {
        var distanceSeconds = loopMode.intervalMinutes * 60;
        loopModeCountdownStartDate = new Date().getTime();

        loopMode.countdown.seconds = Math.floor(distanceSeconds % 60);
        loopMode.countdown.minutes = Math.floor((distanceSeconds / 60) % 60);
        loopMode.countdown.hours = Math.floor(distanceSeconds / 3600);

        loopModeCountdownInterval = $interval(function() {
          let diff = new Date().getTime() - loopModeCountdownStartDate;
          let remainingSeconds = distanceSeconds - diff/1000;
          if(remainingSeconds <= 0) {
            $interval.cancel(loopModeCountdownInterval);
            loopModeCountdownInterval = null;
            $state.go('home.newtest', {isLoopIteration: true}, {reload: true});
          }

          loopMode.countdown.seconds = Math.floor(remainingSeconds % 60);
          loopMode.countdown.minutes = Math.floor((remainingSeconds / 60) % 60);
          loopMode.countdown.hours = Math.floor(remainingSeconds / 3600);
        }, 1000);
      }
    }

    var COOKIES = {
      COOKIES_POLICY: $cookies.get('cookies_policy') !== undefined ? true : false,
      TERMS: 'RMBTterms',
      UUID: 'RMBTuuid',
      CONFIG: 'RMBTconfig',
      OPEN_DATA: 'opendata'
    };

    function getCookies(cookie) {
      return $cookies.get(cookie);
    }

    var URL_BASE = MAIN.SERVER.CONTROL + '/';

    var simpleSearch = function(key, value) {
      var e = {}; e[key] = value; return e;
    };

    var simpleSearchLowerCase = function(key, value) {
      var e = {}; e[key] = angular.lowercase(value); return e;
    };

    var TEST_DETAILVIEW_KEYS = ['time', 'timezone', 'signal_strength', 'network_type', 'location', 'country_location', 'country_asn', 'country_geoip', 'cell_id', 'speed_test_duration', 'client_public_ip', 'client_public_ip_as', 'client_public_ip_as_name', 'client_local_ip', 'nat_type', 'network_operator_name', 'network_operator', 'network_sim_operator', 'roaming', 'total_bytes', 'total_if_bytes',
      // SDNT-179 - removed some fields according the ticket
      //'testdl_if_bytes_download', 'testdl_if_bytes_upload', 'testul_if_bytes_upload', 'testul_if_bytes_download',
      'time_dl', 'duration_dl', 'time_ul', 'duration_ul',
      'server_name', 'plattform', 'os_version', 'model', // SDRU-110 - removed some fields in the results
      //'client_name', 'client_software_version', 'encryption', 'client_version', 'duration',
      'num_threads', 'num_threads_ul', 'adv_spd_option_name', 'adv_spd_down_kbit', 'adv_spd_up_kbit', 'adv_spd_deviation_up_kbit', 'adv_spd_deviation_down_kbit',
      'additional_report_fields.peak_down_kbit', 'additional_report_fields.peak_up_kbit',	'open_test_uuid'];

    var DETAILVIEW_KEY_FUNCTIONALITY = {
      'time': {
        'search': function(key, value) {
          return dateQueryString(key, value, $filter);
        }
      },
      'client_public_ip_as_name': {
        'key': 'public_ip_as_name',
        'search': simpleSearch
      },
      'network_operator_name': {
        'key': 'network_name',
        'search': simpleSearch
      },
      'country_geoip': {
        'translate_prefix': 'countries.',
        'search': simpleSearchLowerCase
      },
      'country_location': {
        'translate_prefix': 'countries.'
      },
      'country_asn': {
        'translate_prefix': 'countries.'
      },
      'plattform': {
        'key': 'platform',
        'search': simpleSearch
      },
      'model': {
        'search': simpleSearch
      },
      'client_software_version': {
        'key': 'client_version',
        'search': simpleSearch
      }
    };

    function mergeTestDetailViewFunctionality() {
      var parsedKeys = {};
      angular.forEach(TEST_DETAILVIEW_KEYS, function(value) {
        parsedKeys[value] = DETAILVIEW_KEY_FUNCTIONALITY[value];
      });
      return parsedKeys;
    }

    function getConfig() {
      var config = $cookies.get(COOKIES.CONFIG);
      if (!config) {
        config = {
          lang: MAIN.PREFERRED_LANGUAGE
        };
        var dateExpires = new Date();
        dateExpires.setYear(new Date().getFullYear() + 10);
        $cookies.put(COOKIES.CONFIG, JSON.stringify(config), {'expires': dateExpires});
      }
      else {
        config = JSON.parse(config);
      }

      return config;
    }

    function updateConfig(config) {
      $cookies.put(COOKIES.CONFIG, JSON.stringify(config));
    }

    function getLanguage() {
      return getConfig()['lang'];
    }

    function setLanguage(lang) {
      var config = getConfig();
      config['lang'] = lang;
      updateConfig(config);
      setSettingsDirty();
    }

    function getUuid() {
      return localStorage.getItem(COOKIES.UUID);
    }

    function setUuid(uuid) {
      return localStorage.setItem(COOKIES.UUID, uuid);
    }

    function isTCAccepted() {
      var isAccepted = $cookies.getObject(COOKIES.TERMS);
      if (isAccepted !== null && isAccepted !== undefined) {
        return isAccepted;
      }
      return false;
    }

    function setTCAccepted(isAccepted) {
      if (isAccepted) {
        var dateExpires = new Date();
        dateExpires.setYear(new Date().getFullYear() + 10);
        $cookies.putObject(COOKIES.TERMS, isAccepted, {'expires':  dateExpires});
        // At this point if TC are accepted then the data is presumed allowed to be pushed to the server. opendata = true.
        $cookies.put(COOKIES.OPEN_DATA, isAccepted);
      }
    }

    function requestHistory(successFunc, failureFunc) {
      var uuid = getUuid();
      var lang = $translate.use();
      var data = {'uuid': uuid, 'language': lang, 'timezone': getTimezone()};

      $http.post(URL_BASE + 'history', data)
        .then(
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
    }

    function requestSyncCode(successFunc, failureFunc) {
      var uuid = getUuid();
      var lang = $translate.use();
      var data = {'uuid': uuid, 'language': lang, 'timezone': getTimezone()};

      $http.post(URL_BASE + 'sync', data)
        .then(
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
    }

    function sendSyncCode(syncCode, successFunc, failureFunc) {
      var uuid = getUuid();
      var lang = $translate.use();
      var data = {'uuid': uuid, 'language': lang, 'timezone': getTimezone(), 'sync_code': syncCode};

      $http.post(URL_BASE + 'sync', data)
        .then(
          function(data) {
            if (successFunc) {
              successFunc(data.data);
            }
          },
          function(error) {
            if (failureFunc) {
              failureFunc(data.data);
            }
          });
    }

    function setSettingsDirty() {
      settings = null;
    }

    /**
		 * Requests settings from control server or return already fetched data.
		 * @param  {function} successFunc function callback for successful settings request
		 * @param  {function} failureFunc function callback for erronous settings request
		 */
    function getSettings(successFunc, failureFunc) {
      var options = {
        'language': $translate.use(),
        'timezone': getTimezone(),
        //				'name': 'MobilTest',
        'name': MAIN.APP_NAME,
        'terms_and_conditions_accepted': isTCAccepted(),
        'type': 'DESKTOP',
        'version_code': '1',
        'version_name': '1.0'
      };

      var uuid = getUuid();
      if (uuid !== undefined && uuid !== null) {
        options['uuid'] = uuid;
      }

      $http.post(URL_BASE + 'settings', options)
        .then(
          function(data) {
            settings = data.data;
            //store uuid in cookie if not stored already
            var uuid = getUuid();
            if ((uuid === null || uuid === undefined) && settings['settings'] && settings['settings'][0]['uuid'] !== undefined) {
              setUuid(settings['settings'][0]['uuid']);
            }

            if (successFunc !== undefined) {
              successFunc(settings);
            }
          },
          function(error) {
            if (failureFunc !== undefined) {
              failureFunc(error);
            }
          });
    }

    function requestTestResult(testUuid, successFunc, failureFunc) {
      var lang = $translate.use();
      var data = {'test_uuid': testUuid, 'language': lang, 'timezone': getTimezone(), options: ['WITH_KEYS']};
      $http.post(URL_BASE + 'testresult', data)
        .then(
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
    }

    function requestTestResultDetails(testUuid, successFunc, failureFunc) {
      var lang = $translate.use();
      var data = {'test_uuid': testUuid, 'language': lang, 'timezone': getTimezone(), options: ['WITH_KEYS']};

      $http.post(URL_BASE + 'testresultdetail', data)
        .then(
          function(data) {
            if (successFunc) {
              successFunc(data.data);
            }
          },
          function(error) {
            if (failureFunc) {
              failureFunc(data.data);
            }
          });
    }

    function getTimezone() {
      return jstz.determine().name();
    }

    function requestDataCollector(successFunc, failureFunc) {
      $http.get(URL_BASE + 'requestDataCollector')
        .then(
          function(data) {
            if (successFunc) {
              successFunc(data.data);
            }
          },
          function(error) {
            if (failureFunc) {
              failureFunc(data.data);
            }
          });
    }

    var advSearch = {
      enabled: false,
      technology: -1,
      up: {
        value: null,
        unit: 'mbps'
      },
      down: {
        value: null,
        unit: 'mbps'
      },
      fail: {}
    };

    function getAdvSearchRequestData () {
      if (!advSearch.enabled) {
        return false;
      }

      var spd = advSearchService.getNormalizedSpeed(advSearch.up, advSearch.down);

      return {
        advertised_speed_option_uid: advSearch.technology,
        speed_down_kbps: spd.down,
        speed_up_kbps: spd.up
      };
    }

    var testIsRunning = false;

    function getTestIsRunning() {
      return testIsRunning;
    }

    function setTestIsRunning(value) {
      testIsRunning = value;
    }

    return {
      loopMode: loopMode,
      loopModeNext: loopModeNext,
      loopModeAbort: loopModeAbort,

      advSearch: advSearch,

      getAdvSearchRequestData: function () { return getAdvSearchRequestData(); },

      acceptCookiesPolicy: function() { return acceptCookiesPolicy(); },
      getCookies: function(cookie) { return getCookies(cookie); },

      getConfig: function() { return getConfig(); },
      getLanguage: function() { return getLanguage(); },
      setLanguage: function(lang) { return setLanguage(lang); },

      getUuid: function() { return getUuid(); },
      setUuid: function(uuid) { return setUuid(uuid); },

      isTCAccepted: function() { return isTCAccepted(); },
      setTCAccepted: function(isAccepted) { return setTCAccepted(isAccepted); },

      requestSyncCode: function(successFunc, failureFunc) { return requestSyncCode(successFunc, failureFunc); },
      sendSyncCode: function(syncCode, successFunc, failureFunc) { return sendSyncCode(syncCode, successFunc, failureFunc); },

      requestHistory: function(successFunc, failureFunc) { return requestHistory(successFunc, failureFunc); },
      requestTestResult: function(testUuid, successFunc, failureFunc) { return requestTestResult(testUuid, successFunc, failureFunc); },
      requestTestResultDetails: function(testUuid, successFunc, failureFunc) { return requestTestResultDetails(testUuid, successFunc, failureFunc); },

      mergeTestDetailViewFunctionality: function(keys) { return mergeTestDetailViewFunctionality(keys); },

      setSettingsDirty: function() { return setSettingsDirty(); },
      getSettings: function(successFunc, failureFunc) { return getSettings(successFunc, failureFunc); },
      getTimezone: function() { return getTimezone(); },

      requestDataCollector: function(successFunc, failureFunc) { return requestDataCollector(successFunc, failureFunc); },

      getTestIsRunning: getTestIsRunning,
      setTestIsRunning: setTestIsRunning,
    };
  }])

  .factory('countryService', ['$filter', '$translate', '$stateParams' ,function($filter, $translate, $stateParams) {
    return {
      getCountries: function() {
        return ['eu', 'af', 'al', 'dz', 'as', 'ad', 'ao', 'ai', 'aq', 'ag', 'ar', 'am', 'aw', 'au', 'at', 'az', 'bs', 'bh', 'bd', 'bb', 'by', 'be', 'bz', 'bj', 'bm', 'bt', 'bo', 'bq', 'ba', 'bw', 'bv', 'br', 'io', 'bn', 'bg', 'bf', 'bi', 'kh', 'cm', 'ca', 'cv', 'ky', 'cf', 'td', 'cl', 'cn', 'cx', 'cc', 'co', 'km', 'cg', 'cd', 'ck', 'cr', 'ci', 'hr', 'cu', 'cw', 'cy', 'cz', 'dk', 'dj', 'dm', 'do', 'ec', 'eg', 'sv', 'gq', 'er', 'ee', 'et', 'fk', 'fo', 'fj', 'fi', 'fr', 'gf', 'pf', 'tf', 'ga', 'gm', 'ge', 'de', 'gh', 'gi', 'gr', 'gl', 'gd', 'gp', 'gu', 'gt', 'gg', 'gn', 'gw', 'gy', 'ht', 'hm', 'va', 'hn', 'hk', 'hu', 'is', 'in', 'id', 'ir', 'iq', 'ie', 'im', 'il', 'it', 'jm', 'jp', 'je', 'jo', 'kz', 'ke', 'ki', 'kp', 'kr', 'kw', 'kg', 'la', 'lv', 'lb', 'ls', 'lr', 'ly', 'li', 'lt', 'lu', 'mo', 'mk', 'mg', 'mw', 'my', 'mv', 'ml', 'mt', 'mh', 'mq', 'mr', 'mu', 'yt', 'mx', 'fm', 'md', 'mc', 'mn', 'me', 'ms', 'ma', 'mz', 'mm', 'na', 'nr', 'np', 'nl', 'nc', 'nz', 'ni', 'ne', 'ng', 'nu', 'nf', 'mp', 'no', 'om', 'pk', 'pw', 'ps', 'pa', 'pg', 'py', 'pe', 'ph', 'pn', 'pl', 'pt', 'pr', 'qa', 're', 'ro', 'ru', 'rw', 'bl', 'sh', 'kn', 'lc', 'mf', 'pm', 'vc', 'ws', 'sm', 'st', 'sa', 'sn', 'rs', 'sc', 'sl', 'sg', 'sx', 'sk', 'si', 'sb', 'so', 'za', 'gs', 'ss', 'es', 'lk', 'sd', 'sr', 'sj', 'sz', 'se', 'ch', 'sy', 'tw', 'tj', 'tz', 'th', 'tl', 'tg', 'tk', 'to', 'tt', 'tn', 'tr', 'tm', 'tc', 'tv', 'ug', 'ua', 'ae', 'gb', 'us', 'um', 'uy', 'uz', 'vu', 've', 'vn', 'vg', 'vi', 'wf', 'eh', 'ye', 'zm', 'zw'];
      },
      getCountriesObject: function() {
        var lang = $stateParams.langcode ? $stateParams.langcode : $translate.use();
        if (!this.result || !this.result[lang]) {
          var translateFilter = $filter('translate');
          var countries = this.getCountries();

          if (!this.result) { this.result = {};}
          this.result[lang] = {};

          for (var c in countries) {
            this.result[lang][countries[c]] = translateFilter('countries.' + countries[c]);
          }
        }
        return this.result[lang];
      }
    };
  }])

  .factory('advertisedSpeedDataService', function() {
    var advSpeed = {};

    advSpeed.setAdvertisedSpeedData = function(data) {
      advSpeed.data = data;
    };

    advSpeed.getAdvertisedSpeedData = function() {
      return advSpeed.data;
    };

    advSpeed.checkOptions = function(data, failFunc) {
      advSpeed.setAdvertisedSpeedData(data);
      var d = advSpeed.getAdvertisedSpeedDataForSubmit();

      if (isNaN(d.adv_spd_up_kbit)) {
        failFunc({error: 'adv_spd.error.up_nan', type: 'up'});
      }
      else if (isNaN(d.adv_spd_down_kbit)) {
        failFunc({error: 'adv_spd.error.down_nan', type: 'down'});
      }
      else if (d.adv_spd_option.uid !== null) {
        if (d.adv_spd_up_kbit > d.adv_spd_option.max_speed_up_kbps) {
          failFunc({error: 'adv_spd.error.up_too_high', type: 'up'});
        }
        else if (d.adv_spd_up_kbit < d.adv_spd_option.min_speed_up_kbps) {
          failFunc({error: 'adv_spd.error.up_too_low', type: 'up'});
        }
        else if (d.adv_spd_down_kbit > d.adv_spd_option.max_speed_down_kbps) {
          failFunc({error: 'adv_spd.error.down_too_high', type: 'down'});
        }
        else if (d.adv_spd_down_kbit < d.adv_spd_option.min_speed_down_kbps) {
          failFunc({error: 'adv_spd.error.down_too_low', type: 'down'});
        }
        else {
          failFunc({});
        }
      }
      else {
        failFunc({});
      }
    };

    advSpeed.getAdvertisedSpeedDataForSubmit = function() {
      if (advSpeed.data) {
        return {
          adv_spd_up_kbit: advSpeed.data.up.unit == 'mbps' ? advSpeed.data.up.value * 1000 : advSpeed.data.up.value,
          adv_spd_down_kbit: advSpeed.data.down.unit == 'mbps' ? advSpeed.data.down.value * 1000 : advSpeed.data.down.value,
          adv_spd_option: advSpeed.data.technology_obj,
          adv_spd_option_id: advSpeed.data.technology_obj.uid
        };
      }

      return null;
    };

    return advSpeed;
  })


  .factory('formatFactory', function() {
    function ifNull(input, defaultValue) {
      return !input ? defaultValue : input;
    }

    function isNullOrEmpty(input) {
      return (!input || input.trim() === '');
    }

    function ifNullOrEmpty(input, defaultValue) {
      return isNullOrEmpty(input) ? defaultValue : input;
    }

    return {
      ifNull : function(input, defaultValue) { return ifNull(input, defaultValue); },
      isNullOrEmpty : function(input) { return isNullOrEmpty(input); },
      ifNullOrEmpty : function(input, defaultValue) { return ifNullOrEmpty(input, defaultValue); }
    };
  })

  .factory('httpRequestInterceptor', ['$q', 'errorHandlerService', function($q, errorHandlerService) {
    return {
      response: function(data) {
        if (data.data.error) {
          if (data.data.error.length > 0) {
            var error= [];
            angular.forEach(data.data.error, function(v, k) {
              error.push(v);
            });

            errorHandlerService.addError('response', error);
          }
        }

        return data;
      },

      requestError: function(error) {
        errorHandlerService.addError('request', [error]);
        return $q.reject(error);
      },

      responseError: function(error) {
        errorHandlerService.addError('response', [error]);
        return $q.reject(error);
      }
    };
  }])

  .factory('socialMediaFactory', ['$window', '$stateParams', function($window, $stateParams) {
    // Refactor the function to accept config file what to replace then return variable for the requested config.
    function encodeURL(urlString, opts) {
      var replaceSlashes = urlString.replace(/\//g, '%2F');
      var replaceColons = replaceSlashes.replace(/:/g, '%3A');
      var replaceSpace = replaceColons.replace(/ /g, '%20');
      return replaceSpace;
    }

    return {
      encodeURL: function (urlString) { return encodeURL(urlString); },
      testResultsURL: $window.document.URL,
      test_uuid: $stateParams.testuuid
    };
  }])

  /**********************************
		FILTERS
	***********************************/

  .filter('formatSpeedWithUnit', ['$filter', function($filter) {
    return function(bytes) {
      var translateFilter = $filter('translate');

      if (bytes === null) {
        return null;
      }

      var unit = translateFilter('unit.bytes');

      if (bytes > 1000) {
        bytes = bytes/1000;
        unit = translateFilter('unit.KB');
      }

      if (bytes > 1000) {
        bytes = bytes/1000;
        unit = translateFilter('unit.MB');
      }

      return bytes.toFixed(2) + ' ' + unit;
    };
  }])

  .filter('ifnull', ['formatFactory', function(formatFactory) {
    return function(input, defaultValue) {
      return formatFactory.ifNull(input, defaultValue);
    };
  }])

  .filter('ifnullSignal', ['formatFactory', function(formatFactory) {
    return function(input1, input2, defaultValue) {
      if (input1 != null) {
        return input1;
      }
      if (input2 != null) {
        return input2;
      }
      return defaultValue;
    };
  }])

  .filter('ifnullOrEmpty', ['formatFactory', function(formatFactory) {
    return function(input, defaultValue) {
      return formatFactory.ifNullOrEmpty(input, defaultValue);
    };
  }])

  .filter('formatOpentestTitle', function() {
    return function(item) {
      return (!item['provider_name'] ? '' : item['provider_name'] + ', ') + item['model'] +
				(!item['platform'] ? '' : ' (' + item['platform'] + ')');
    };
  })

  .filter('formatPing', function() {
    return function(pingMs, defaultValue) {
      if (pingMs === null || pingMs === undefined) {
        return defaultValue;
      }
      return (pingMs/1000000).toFixed(1);
    };
  })

  /*
	*/
  .filter('roundPing', function() {
    return function(pingMs) {
      return Math.round(parseFloat(pingMs));
    };
  })

  .filter('round', function() {
    return function(value, defaultValue) {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      return Math.round(value);
    };
  })

  .filter('formatSpeed', function () {
    return function(number, defaultValue) {
      if (number === null || number === undefined) {
        return defaultValue;
      }

      var fnumber = number / 1000;
      var digits = 0;

      if (fnumber >= 10) {
        digits = 0;
      }
      else if (fnumber >= 1) {
        digits = 1;
      }
      else if (fnumber >= 0.1) {
        digits = 2;
      }
      else {
        digits = 3;
      }

      return (number / 1000).toFixed(digits);
    };
  })

  .filter('parseResultValue', ['$filter', function($filter) {
    return parseResultValue($filter);
  }])

  .filter('formatLocaleDate', ['$filter', function($filter) {
    var dateFilter = $filter('date');
    var translateFilter = $filter('translate');
    return function(dateObejct) {
      return dateFilter(dateObejct, translateFilter('date_format'));
    };
  }])

  .filter('range', function() {
    return function(input, start, total) {
      for (var i=start; i<=total; i++) {
        input.push(i);
      }

      return input;
    };
  })

  /**********************************
		DIRECTIVES
	***********************************/

  .directive('ajaxLoading', ['$http', '$rootScope', '$timeout', function($http, $rootScope, $timeout) {
    return {
      restrict: 'A',
      link : function(scope, ele, attrs) {

        $rootScope.isLoading = function() {
          return ($http.pendingRequests.length > 0);
        };

        var timeout;

        scope.$watch($rootScope.isLoading, function(loading) {
          if (loading) {
            ele.show();

            if (!timeout) {
              timeout = setTimeout(function () {
                ele.hide();
                // $http.pendingRequests = [];

                timeout = null;
              }, 5000);
            }
          } else {
            ele.hide();

            window.clearTimeout(timeout);
            timeout = null;
          }
        });
      }
    };
  }])

  .directive('dynamicHref', ['$state', function($state){
    return {
      restrict:'EA',
      scope:{
        state: '@',
        value: '@',
        options: '&'
      },
      template:'<a href=\'{{dynhrefctrl.getHref()}}\'>{{dynhrefctrl.value}}</a>',
      replace:true,
      bindToController: true,
      controllerAs: 'dynhrefctrl',
      controller: 'DirectiveDynamicHrefController'
    };
  }])

  .service('advSearchService', ['$rootScope', function() {
    var vm = this;

    var technologyOptions = [
      {
        uid: 1,
        name: 'xDSL',
        max_speed_up_kbps: 100000,
        max_speed_down_kbps: 100000,
        min_speed_up_kbps: 0,
        min_speed_down_kbps: 0
      },
      {
        uid: 2,
        name: 'Ethernet',
        max_speed_up_kbps: 1000000,
        max_speed_down_kbps: 1000000,
        min_speed_up_kbps: 0,
        min_speed_down_kbps: 0
      },
      {
        uid: 3,
        name: 'DOCSIS',
        max_speed_up_kbps: 108000,
        max_speed_down_kbps: 400000,
        min_speed_up_kbps: 0,
        min_speed_down_kbps: 0
      }
    ];

    vm.getTechnologyOptions = function () {
      return technologyOptions;
    };

    vm.validate = function (technology, up, down) {
      var normalizedSpd = vm.getNormalizedSpeed(up, down);
      var technologyOption = technologyOptions[technology] || null;
      var fail = {};

      if (!normalizedSpd.up) {
        fail = {error: 'adv_spd.error.up_nan', type: 'up'};
      } else if (!normalizedSpd.down) {
        fail = {error: 'adv_spd.error.down_nan', type: 'down'};
      } else if (technology !== -1) {
        if (normalizedSpd.up > technologyOption.max_speed_up_kbps) {
          fail = {error: 'adv_spd.error.up_too_high', type: 'up'};
        } else if (normalizedSpd.up < technologyOption.min_speed_up_kbps) {
          fail = {error: 'adv_spd.error.up_too_low', type: 'up'};
        } else if (normalizedSpd.down > technologyOption.max_speed_down_kbps) {
          fail = {error: 'adv_spd.error.down_too_high', type: 'down'};
        } else if (normalizedSpd.down < technologyOption.min_speed_down_kbps) {
          fail = {error: 'adv_spd.error.down_too_low', type: 'down'};
        } else {
          fail = {};
        }
      } else {
        fail = {};
      }

      return {
        state: !fail.error,
        fail: fail
      };
    };

    vm.getNormalizedSpeed = function (up, down) {
      return {
        up: up.value ? (up.unit === 'mbps' ? up.value * 1000 : up.value) : false,
        down: down.value ? (down.unit === 'mbps' ? down.value * 1000 : down.value) : false
      };
    };
  }])

  .directive('advancedSearch', [function(){
    return {
      scope:{
        advSearch: '=model',
        fail: '=err'
      },
      templateUrl: 'views/advancedsearch.html',
      restrict: 'E',
      bindToController: true,
      controllerAs: 'advSrchCtrl',
      controller: 'CustomerController'
    };
  }])

  .directive('multiselect', [function(){
    return {
      templateUrl: 'views/multiselect.html',
      replace: true,
      scope: {
        items: '=',
        selectedItems: '=',
        onSelect: '='
      },
      controller: function($scope) {
        $scope.trigger = function (e) {
          var el = e.originalEvent.target;
          $scope.t = el.offsetTop;
          $scope.l = el.offsetLeft;
          $scope.width = el.offsetWidth;
          $scope.style = {
            width: el.offsetWidth,
            top: el.offsetTop,
            left: el.offsetLeft
          };
          window.qqq = e.originalEvent.target;
          $scope.active = !$scope.active;
        };
        $scope.active = false;
      },
      link: function() {
      }
    };
  }])

  .directive('customerFooter', ['MAIN', function() {
    return {
      templateUrl: 'views/footer.html'
    };
  }])

  .directive('showMoreResults', ['$rootScope', '$http', '$window', function($rootScope, $http, $window) {
    return {
      restrict: 'A',
      scope: {
        scrollable: '&'
      },
      link: function(scope, ele) {
        var $w = angular.element($window);
        $w.bind('scroll', function() {
          //debugService.log('w.scrolltop: ' + $w.scrollTop() + ' (' + ($w.scrollTop() + ele.position().top) + ' > ' + ele.height() + ') w.height: ' + $w.height() + ', ele height = ' + ele.height() + ' ele top = ' + ele.position().top + ', diff = ' + (ele.position().top - ele.height()) + ', ele scrollTop = ' + ele.scrollTop());
          if (scope.scrollable() && ($http.pendingRequests.length === 0) && ($w.scrollTop() + ele.position().top) > ele.height()) {
            $rootScope.$broadcast('onShowMoreResults');
          }
        });
      }
    };
  }])

  .directive('testList', function() {
    return {
      restrict: 'A',
      scope: {
        results: '=',
        target: '@'
      },
      templateUrl: 'views/components/testlist.html',
      replace: true
    };
  })

  .directive('jqueryMenu', ['$timeout', 'userFactory', function($timeout, userFactory) {
    //need better solution for moving menu and settings
    return {
      link: function () {
        var nav = angular.element('#nav');
        var container = angular.element('.container');
        var settingsLink = angular.element('.settings-link');

        var mainMenu = angular.element('.menu-link');

        mainMenu.click(function(e){
          e.preventDefault();
          $timeout(function() {
            if (userFactory.getTestIsRunning()) {
              return
            }
            nav.toggleClass('active');
            settingsLink.toggleClass('hide-on-mobile');
            container.toggleClass('active');
          });
        });

        // Close menu on cursor exit out of the menu container
        nav.mouseleave(function(e) {
          e.preventDefault();
          $timeout(function() {
            nav.removeClass('active');
            container.removeClass('active');
          });
        });

        var menuItem = angular.element('#nav ul');

        menuItem.click(function(){
          $timeout(function() {
            nav.removeClass('active');
            container.removeClass('active');
          });
        });

        var settings = angular.element('.settings');

        // Toggle settings
        settingsLink.click(function () {
          settings.slideToggle('200', 'swing');
          return false;
        });
      }
    };
  }])

  .directive('hideOnMobile', ['$window', function($window) {
    return {
      link: function(scope, ele) {
        var userAgent = $window.navigator.userAgent;
        if (userAgent) {
          if (userAgent.indexOf('SpecureNetTest') >= 0) {
            ele.hide();
          }
        }
      }
    };
  }])

  .directive('signalCurve', ['$filter', function($filter) {
    return {
      restrict: 'A',
      scope: {
        curve: '&',
        options: '&',
        color: '@',
        yMax: '&',
        yMin: '&',
        yTicks: '&'
      },
      link: function(scope, ele, attrs) {
        var width = attrs.width;
        var height = attrs.height;
        var translateFilter = $filter('translate');

        var padding = {
          l: 50,
          r: 25,
          b: 40
        };

        var colors = {
          '4G': {
            fill: 'rgba(102,102,220,.5)',
            stroke: '#222288'
          },
          'WLAN': {
            fill: 'rgba(102,220,220,.5)',
            stroke: '#228888'
          },
          'DEFAULT': {
            fill: 'rgba(102,220,102,.5)',
            stroke: '#228822'
          }
        };

        var ctx = ele[0].getContext('2d');
        ctx.font='10px Courier';

        scope.$watch(scope.curve, function(newData) {
          if (newData && newData['signals']) {
            newData['signals'][0][0]['time_elapsed'] = 0;
            var minX = newData['signals'][0][0]['time_elapsed'];
            var maxX = newData['signals'][newData['signals'].length-1][newData['signals'][newData['signals'].length-1].length-1]['time_elapsed'];

            var relX = (width - padding.l - padding.r)/maxX;
            var relY = (height - padding.b)/(scope.yMax() - scope.yMin());

            var yTicks = scope.yTicks();

            ctx.globalAlpha = 1;

            angular.forEach(yTicks, function(tick, index) {
              var py = height - padding.b - (tick - scope.yMin()) * relY;
              ctx.fillText(tick, padding.l - ctx.measureText(tick).width - 5, py);

            });

            var relXLabel = ((maxX - minX) / 10);
            for (var j = 0; j < 11; j++) {
              var px = padding.l + relX * relXLabel * j;

              ctx.fillText((((j)*relXLabel)/1000).toFixed(1), px, height-padding.b+15);
            }
            ctx.save();
            ctx.translate(padding.l+12, 15);
            //ctx.rotate(-Math.PI/2);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText('[dBm]', - ctx.measureText('[dBm]').width, -7);
            ctx.restore();
            ctx.fillStyle = 'black';
            ctx.fillText('[s]', (width)-ctx.measureText('[s]').width, height-15);
            //ctx.fillText('[s]', (width / 2)-ctx.measureText('[s]').width / 2, height-15);

            //ctx.globalAlpha = 0.5;
            angular.forEach(newData['signals'], function(value) {
              switch (value[0]['cat_technology']) {
              case '4G':
                ctx.fillStyle=colors['4G']['fill'];
                ctx.strokeStyle=colors['4G']['stroke'];
                break;
              case 'WLAN':
                ctx.fillStyle=colors['WLAN']['fill'];
                ctx.strokeStyle=colors['WLAN']['stroke'];
                break;
              default:
                ctx.fillStyle=colors['DEFAULT']['fill'];
                ctx.strokeStyle=colors['DEFAULT']['stroke'];
                break;
              }

              angular.forEach(value, function(item, i) {
                var px = padding.l + relX * item['time_elapsed'];
                var py = height - padding.b - (item['_signal_strength'] - scope.yMin()) * relY;
                if (i === 0) {
                  ctx.beginPath();
                  ctx.moveTo(px, height - padding.b);
                }
                ctx.lineTo(px, py);

                if ((i+1) === value.length) {
                  ctx.lineTo(px, height - padding.b);
                  ctx.fill();
                  ctx.stroke();
                }
              });

              var firstElementX = padding.l + relX * value[0]['time_elapsed'];
              ctx.fillStyle='rgba(20,20,20,1)';
              ctx.fillText(value[0]['network_type'],firstElementX+5,height-padding.b-5);
            });

            if(newData['additional']) {
              angular.forEach(newData['additional'], function(item, index) {
                ctx.fillStyle='rgba(50,50,50,0.25)';
                ctx.strokeStyle='rgba(50,50,50,0.5)';

                var sx = padding.l + relX * item['start'];
                var ex = padding.l + relX * item['end'];


                ctx.beginPath();
                ctx.moveTo(sx,0);
                ctx.lineTo(sx,height-padding.b);
                ctx.lineTo(ex,height-padding.b);
                ctx.lineTo(ex,0);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle='rgba(20,20,20,1)';
                ctx.fillText(translateFilter(index),sx,10);
              });
            }

            //draw x, y axis:
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.strokeStyle='#000000';
            ctx.moveTo(padding.l, 0);
            ctx.lineTo(padding.l, height-padding.b+5);
            ctx.moveTo(padding.l-5, height-padding.b);
            ctx.lineTo(width, height-padding.b);
            ctx.stroke();
          }
        });
      }
    };
  }])

  .directive('includeI18nComponent', ['$translate', function($translate) {
    return {
      template: "<div data-ng-include=\"'views/lang_components/' + getLang() + '/' + source\"></div>",
      scope: {
        source: '@'
      },
      replace: true,
      link: function(scope) {
        scope.getLang = function() {
          return $translate.use();
        };
      }
    };
  }])

  .directive('errorHandler', ['errorHandlerService', '$rootScope', '$compile', '$timeout', function(errorHandlerService, $rootScope, $compile, $timeout) {
    var TEMPLATE = "<div id='error-handler' data-ng-click='clear();' data-ng-show='(error.request || error.response) && showErrors()' style='z-index:10000; clear:both; color: #333; padding:6px; margin:3px; border-radius:3px; background: #ffecec; border:1px solid #f5aca6;'>" +
    "<div data-ng-show='error.request'> <p><strong>{{'error._request_error' | translate}}</strong>: <p data-ng-repeat='e in error.request'>[<strong>{{e.time}}</strong>] {{e.msg}}</p></p></div>" +
    "<div data-ng-show='error.response'> <p><strong>{{'error._response_error' | translate}}</strong>: <p data-ng-repeat='e in error.response'>[<strong>{{e.time}}</strong>] {{e.msg}}</p></p></div></div>";

    return {
      scope: {
        selector: '@'
      },
      template: TEMPLATE,
      link: function(scope) {
        scope.showErrors = function() {
          return true;
        };

        scope.getError = function() {
          return errorHandlerService.getError();
        };

        scope.clear = function() {
          errorHandlerService.clear();
        };

        scope.$watch(scope.getError, function(newValue) {
          $timeout(function() {
            scope.error = newValue;
          });
        });
      }
    };
  }])

  .directive('trafficConsumptionWarning', ['$rootScope', 'ngDialog', 'MAIN', function($rootScope, ngDialog, MAIN) {
    return {
      link: function() {
        var TEMPLATE = "<h3>{{'title_data_consumption_warning' | translate }}</h3><div class='ngdialog-message' data-ng-include=\"'views/lang_components/' + dcctrl.getLang() + '/data_consumption_warning.html'\"></div>" +
					"<div class='ngdialog-buttons'><button class='ngdialog-button ngdialog-button-primary' data-ng-click='dcctrl.ok(ngDialogId)'>OK</button><button class='ngdialog-button' data-ng-click='dcctrl.cancel(ngDialogId)'>CANCEL</button></div>";

        if (MAIN.FEATURES.DATA_CONSUMPTION_WARNING) {
          ngDialog.openConfirm(
            {
              template: TEMPLATE,
              plain: true,
              showClose: false,
              controller: 'DataConsumptionWarningController',
              controllerAs: 'dcctrl'
            });
        }
        else {
          $rootScope.$broadcast('dataConsumptionWarningAccepted');
        }
      }
    };
  }])

  .directive('termsConditionsCheck', ['$rootScope', 'userFactory', 'ngDialog', 'MAIN', function($rootScope, userService, ngDialog, MAIN) {
    return {
      link: function() {
        var TEMPLATE = "<h3>{{'title_terms_and_conditions' | translate }}</h3><div class='ngdialog-message' data-ng-include=\"'views/lang_components/' + tcctrl.getLang() + '/tc.html'\"></div>" +
        "<div data-ng-include=\"'views/lang_components/' + tcctrl.getLang() + '/tc_opendata.html'\"></div>" +
        "<div class='ngdialog-buttons'><button class='ngdialog-button ngdialog-button-primary' data-ng-click='tcctrl.ok(ngDialogId)'>OK</button><button class='ngdialog-button' data-ng-click='tcctrl.cancel(ngDialogId)'>CANCEL</button></div>";

        if (MAIN.FEATURES.SHOW_TERMS_AND_CONDITIONS_POPUP && !userService.isTCAccepted()) {
          ngDialog.openConfirm(
            {
              template: TEMPLATE,
              plain: true,
              showClose: false,
              controller: 'TermsAndConditionsController',
              controllerAs: 'tcctrl',
              closeByDocument: false,
              closeByEscape: false
            }).catch(() => false);
        }
        else {
          $rootScope.$broadcast('termsAndConditionsAccepted', true);
        }
      }
    };
  }])

  .directive('loadMap', ['$rootScope', 'MAP', function($rootScope, MAP) {
    return {
      restrict: 'E',
      scope: {
        provider: '@'
      },
      link: function(scope, ele) {
        scope.enabled = MAP.PROVIDER[scope.provider] && MAP.PROVIDER[scope.provider].enabled;
        scope.key = MAP.PROVIDER[scope.provider] && MAP.PROVIDER[scope.provider].key;
      }
    };
  }])

  /**********************************
		DEBUG SERVICE
	***********************************/

  .service('debugService', ['$rootScope', function($rootScope) {
    this.log = function(msg) {
      $rootScope.$broadcast('_debugOnLog', msg);
    };

    this.warn = function(msg) {
      $rootScope.$broadcast('_debugOnWarn', msg);
    };

    this.error = function(msg) {
      $rootScope.$broadcast('_debugOnError', msg);
    };
  }])

  .controller('debugController', ['$scope', function($scope) {
    var vm = this;
    vm.showLog = true;
    vm.showWarn = true;
    vm.showError = true;

    $scope.$on('_debugOnLog', function (event, msg) {
      vm.log = msg;
      vm.logTs = new Date();
      //$scope.$apply();
    });

    $scope.$on('_debugOnWarn', function (event, msg) {
      vm.warn = msg;
      vm.warnTs = new Date();
      //$scope.$apply();
    });

    $scope.$on('_debugOnError', function (event, msg) {
      vm.error = msg;
      vm.errorTs = new Date();
      //$scope.$apply();
    });
  }])

  .directive('debug', function() {
    return {
      controller: 'debugController',
      controllerAs: '_debug',
      bindToController: true,
      replace: true,
      template: "<section style='color: #eee; font-weight:bold; padding:6px; border-radius:3px; background: #777; border:1px solid #222;'>" +
				"<style scoped>.debug-control {float: left; margin: 1px; border:1px solid #f5aca6; border-radius:3px; padding: 5px}</style>"+
				"<p>DEBUG CONSOLE"+
					"<div class='debug-control' style='float: left' data-ng-click='_debug.showError=!_debug.showError;'>display error: {{_debug.showError}}</div>"+
					"<div class='debug-control' data-ng-click='_debug.showWarn=!_debug.showWarn;'>display warning: {{_debug.showWarn}}</div>"+
					"<div class='debug-control' data-ng-click='_debug.showLog=!_debug.showLog;'>display log: {{_debug.showLog}}</div>"+
					"<div style='clear:both'></div>"+
				"</p>" +
				"<div data-ng-click='_debug.error=null;' style='clear:both; color: #333; padding:6px; border-radius:3px; background: #ffecec; border:1px solid #f5aca6;' data-ng-show='_debug.showError && _debug.error.length>0'>ERROR [<span data-ng-bind='_debug.errorTs'></span>] <p style='font-weight:normal;' data-ng-bind='_debug.error'></p></div>" +
				"<div data-ng-click='_debug.warn=null;' style='clear:both; color: #333; padding:6px; border-radius:3px; background: #fff8c4; border:1px solid #f2c779;' data-ng-show='_debug.showWarn && _debug.warn.length>0'>WARN [<span data-ng-bind='_debug.warnTs'></span>] <p style='font-weight:normal;' data-ng-bind='_debug.warn'></p></div>" +
				"<div data-ng-click='_debug.log=null;' style='clear:both; color: #333; padding:6px; border-radius:3px; background: #e3f7fc; border:1px solid #8ed9f6;' data-ng-show='_debug.showLog && _debug.log.length>0'>LOG [<span data-ng-bind='_debug.logTs'></span>] <p style='font-weight:normal;' data-ng-bind='_debug.log'></p></div>" +
				"</section>",
      link: function() {

      }
    };
  });

function parseResultValue($filter) {
  return function (item, options) {
    if (!options) {
      return item;
    }

    if (options['filter']) {
      return options['filter'](item);
    }

    if (options['translate_prefix']) {
      return $filter('translate')(options['translate_prefix'] + angular.lowercase(item));
    }

    return item;
  };
}