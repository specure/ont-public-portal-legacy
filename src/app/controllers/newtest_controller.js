angular.module('nettestApp').controller("NewTestController", ["$translate", "$scope", "$rootScope", "$state", "$stateParams", "$log", "MAIN", "MAP", "userFactory", "advSearchService", "mapService", function ($translate, $scope, $rootScope, $state, $stateParams, $log, MAIN, MAP, userFactory, advSearchService, mapService) {
  var vm = this;

  vm.isHistoryAllowed = null;

  vm.uuid = undefined;

  log = $log;
  if (log && log.getLogger) {
    log.getLogger("rmbtws").setLevel("error");
  }

  var Hosts = {
    SERVER: MAIN.HOST.SERVER,
    SERVICES: {
      control: MAIN.HOST.CONTROL,
      serverList: MAIN.HOST.SERVER_LIST,
      stats: MAIN.SERVER.STATISTICS,
      map: MAIN.SERVER.MAP
    }
  };

  var COOKIES = {
    UUID: 'RMBTuuid',
    CONFIG: 'RMBTconfig'
  };

  this.getUuid = function() {
    return localStorage.getItem(COOKIES.UUID);
  };

  this.setUuid = function(uuid) {
    localStorage.setItem(COOKIES.UUID, uuid);
  };

  this.getCookie = function(name) {
    var re = new RegExp(name + "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value !== null) ? decodeURI(value[1]) : null;
  };

  this.getUserSettings = function () {
    return new Promise(function (resolve, reject) {
      var options = {
        "language": "en",
        "timezone": "Europe/Bratislava",
        "name": "NetTest",
        "terms_and_conditions_accepted": true,
        "type": "DESKTOP",
        "version_code": "1",
        "version_name": "1.0",
      };

      var uuid = vm.getUuid();
      if ($stateParams.userUUID) {
        options["uuid"] = $stateParams.userUUID;
      } else {
        if (uuid !== undefined && uuid !== null) options["uuid"] = uuid;
      }
      if (!vm.isHistoryAllowed) {
        options.uuid = undefined;
      }
      $.ajax({
        type: "POST",
        url: Hosts.SERVER + "/" + Hosts.SERVICES.control + "/settings",
        data: JSON.stringify(options),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      }).then(function (data) {
        var settings = data;


        if (uuid && !settings["settings"][0]["uuid"]) {
          settings["settings"][0]["uuid"] = uuid;
        }

        var historyStatus = 'historyIsNotAllowed';
        var nextUuid = vm.getUuid();
        if((nextUuid === null || nextUuid === undefined || historyStatus === 'historyIsNotAllowed') && settings["settings"] && settings["settings"][0]["uuid"] !== undefined ) {
          if (vm.isHistoryAllowed) {
            vm.setUuid(settings["settings"][0]["uuid"]);
            historyStatus = 'historyIsAllowed';
            vm.settings = settings;
          } else {
            historyStatus = 'historyIsNotAllowed';
            vm.setUuid(settings["settings"][0]["uuid"]);
            settings["settings"][0]["uuid"] = data["settings"][0]["uuid"];
            vm.settings = settings;
            vm.setUuid(data["settings"][0]["uuid"]);
          }

        }

        // vm.settings = settings;
        resolve(settings);
      }, function (error) {
        reject(error);
      });
    });
  };

  vm.isLoopIteration = $stateParams.isLoopIteration;

  vm.launchTest = function () {
    if (userFactory.getTestIsRunning()) {
      console.log("Test is running already");
      return;
    }
    userFactory.setTestIsRunning(true);
    console.log('Test started at:', new Date().toISOString());
    TestEnvironment.init(
      new DemoTestVisualization(
        success => {
          userFactory.setTestIsRunning(false);
          console.log('Test ended at:', new Date().toISOString());
          termsEventSubscription();

          if(!userFactory.loopMode.isEnabled) {
            $state.go("home.historytest", {"testuuid": success.testUUID});
          } else {
            userFactory.loopModeNext();
            $state.go("home.index", {}, {reload: true});
          }

        },
        error => {
          userFactory.setTestIsRunning(false);
          console.warn(error);
          showFF82Dialog($translate);
        }
      ),
      null
    );
    var config = new RMBTTestConfig("en", Hosts.SERVER, Hosts.SERVICES.control, MAIN.THREADS);
    var ctrl = new RMBTControlServerCommunication(config, userFactory.getAdvSearchRequestData(), mapService.TestServer);

    this.getUserSettings().then(function (data) {
      config.uuid = vm.getUuid();
      var websocketTest = new RMBTTest(config, ctrl);

      TestEnvironment.getTestVisualization().setRMBTTest(websocketTest);
      TestEnvironment.getTestVisualization().startTest(); //start the visualization

      websocketTest.startTest(vm.isLoopIteration);
    }).catch(() => {
      userFactory.setTestIsRunning(false);
    })
  }

  var termsEventSubscription = $rootScope.$on("termsAndConditionsAccepted", function (isAllowed) {
    vm.isHistoryAllowed = isAllowed;
    vm.launchTest();
  }.bind(this));

  vm.isFF82 = () => {
    const {name, version} = navigator.browserSpecs;
    return name === 'Firefox' && version === '82';
  };

}]);

function showFF82Dialog($translate) {
  Promise.all([
    $translate('test.phase.ERROR'),
    $translate('test.retry'),
  ]).then(([title, retry]) => {
    $('#ff-dialog').dialog({
      modal: true,
      draggable: false,
      resizable: false,
      width: Math.min(440, window.innerWidth - 40),
      buttons: {
        [`${retry.substr(0, 1).toUpperCase()}${retry.substr(1)}`]: () => {
          location.reload();
        }
      },
      title
    });
  });
}
