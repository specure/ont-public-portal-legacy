function debouncee(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function setDebounceTileLayer(wait) {
  L.TileLayer.DebounceTileLayer = L.TileLayer.extend({
    _update: debouncee(function (center) {
      L.TileLayer.prototype._update.call(this, center);
    }, wait),
  });

  L.tileLayer.debounceTileLayer = function (options) {
    return new L.TileLayer.DebounceTileLayer(options);
  };
}

function dispatchReizeEvent() {
  var resizeEvent = window.document.createEvent('UIEvents');
  resizeEvent.initUIEvent('resize', true, false, window, 0);
  window.dispatchEvent(resizeEvent);

  resizeEvent = window.document.createEvent('Event');
  resizeEvent.initEvent('resize', true, false, window, 10);
  window.dispatchEvent(resizeEvent);
}

angular.module('nettestApp').controller('MapController', ['mapService', '$compile', '$cookies', '$scope', '$timeout', 'MAP', 'MAIN', function(ms, $compile, $cookies, $scope, $timeout, MAP, MAIN) {
  var vm = this;

  vm.MAP = MAP;
  vm.NO_INFO_SYMBOL = "-";
  vm.DEFAULT_POINT_DIAMETER = 8;
  vm.SearchBox = null;
  vm.LayerTypes = MAP.LAYER_TYPES || ms.DefaultLayerTypes;
  vm.MapTypes = ms.getMapTypes(MAP.DEFAULT_PROVIDER);
  vm.LayerMap = null;
  vm.LayerStatistics1 = null;
  vm.LayerStatistics2 = null;
  vm.LayerStatistics3 = null;
  vm.SwitchHeatmapZoom = 13; // FIX - requested by RU. Thershold to switch from heatmap into Point. Was: 14
  vm.Legend = [];
  vm.PopUp = null;
  vm.MData = null;

  vm.TestServers = ms.TestServers;
  vm.TestServer = ms.TestServer;

  MAIN.FEATURES.TEST_SERVER_SELECT && ms.setTestServerList(vm);

  vm.onLoad = function () {
    vm.Map = initMap();

    if (MAIN.FEATURES.GOOGLE_MUTANT) { vm.Map.addControl(new L.Control.Fullscreen()); }

    vm.Map.on('fullscreenchange', function () {
      $timeout(function(){
        vm.Map.panBy([1,1]);
      }, 500);
    });

    ms.getMapFilterData(vm);

    setTimeout(function() {
      vm.Map.invalidateSize();
      dispatchReizeEvent();
    }, 300)
    setTimeout(function() {
      vm.Map.invalidateSize();
      dispatchReizeEvent();
    }, 1000)
    setTimeout(function() {
      vm.Map.invalidateSize();
      dispatchReizeEvent();
    }, 3000)
    setTimeout(function() {
      vm.Map.invalidateSize();
      dispatchReizeEvent();
    }, 5000)
  }

  if (document.readyState == 'complete') {
    vm.onLoad();
  }
  window.onload = vm.onLoad;

  $scope.$on('handleLanguageChange', function() {
    vm.removeMapLayers();
    ms.getMapFilterData(vm);
  });

  function initMap () {
    setDebounceTileLayer(MAP.TILES_REQUEST_DELAY || 2000);

    var hasCustomAttribute = (MAP.DEFAULT_PROVIDER === 'MAPBOX' || !MAP.DEFAULT_PROVIDER);
    console.log(hasCustomAttribute);

    var mapOptions = {
      scrollWheelZoom: true,
      minZoom: MAP.MIN_ZOOM || 3,
      maxZoom: MAP.MAX_ZOOM || 16,
      attributionControl: !hasCustomAttribute
    };

    const location = $cookies.getObject('Location') || {};
    const center = location.lat && location.lng
      ? new L.LatLng(location.lat, location.lng)
      : new L.LatLng(MAP.CENTER.LAT, MAP.CENTER.LONG);
    const zoom = location.zoom || MAP.INITIAL_ZOOM;
    if (location && location.address) {
      const searchBox = document.getElementById('srchinput');
      if (searchBox) {
        searchBox.value = location.address;
      }
    }

    const mapChangeCallback = (e) => {
      const location = $cookies.getObject('Location') || {};
      const center = e.target.getCenter();
      $cookies.putObject('Location', Object.assign(
        location,
        { lat: center.lat, lng: center.lng, zoom: e.target.getZoom() },
      ));
    };

    let map = L.map('map', mapOptions).on('zoomend', mapChangeCallback).on('moveend', mapChangeCallback);
    
    if (center.lat === MAP.CENTER.LAT
      && center.lng === MAP.CENTER.LONG
      && zoom === MAP.INITIAL_ZOOM
      && MAP.BOUNDS
    ) {
      map = map.on('load', function (e) {            
        e.target.fitBounds(MAP.BOUNDS);
      });
    }

    if (hasCustomAttribute) {
      if (MAP.DEFAULT_PROVIDER === 'MAPBOX' || !MAP.DEFAULT_PROVIDER) {
        var control = L.control.attribution().addTo(map);
        control.addAttribution('© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>');
      }
    }

    return map.setView(center, zoom);
  }

  vm.getLayerParams = function () {
    var tmpMeasurementTypeKey = vm.Filter.MeasurementType.id;
    var tmpStatisticMethod = vm.Filter.StatisticMethod.value;
    var tmpPeriod = vm.Filter.Period.period;
    var tmpOperator = (vm.Filter.Operator && vm.Filter.Operator.provider) || "";
    var tmpTechnology = vm.Filter.Technology.length === 3 ?
      "" :
      vm.Filter.Technology.reduce(function (accumulator, currentValue) { return accumulator + currentValue.id }, "");
    var mapOptions = vm.Filter.MeasurementOption.id + "/" + vm.Filter.MeasurementType.id;

    if (tmpMeasurementTypeKey === 'all') {
      tmpOperator = null;
      tmpTechnology = null;
    }
    if (tmpMeasurementTypeKey === 'wifi' || tmpMeasurementTypeKey === 'browser') {
      tmpTechnology = null;
    }

    return {
      tmpMeasurementTypeKey: tmpMeasurementTypeKey,
      tmpStatisticMethod: tmpStatisticMethod,
      tmpPeriod: tmpPeriod,
      tmpOperator: tmpOperator,
      tmpTechnology: tmpTechnology,
      mapOptions: mapOptions,
    }
  }

  vm.getStatisticLayer1 = function() {
    console.log('getStatisticLayer1');
    var params = vm.getLayerParams();

    return L.tileLayer.debounceTileLayer(
      MAIN.SERVER.MAP + '/tiles/' +
      ((vm.Filter.Layer === 'automatic') ? 'heatmap' : vm.Filter.Layer) +
      '/{z}/{x}/{y}.png?' +
      'highlight=null' +
      '&statistical_method=' + params.tmpStatisticMethod +
      '&period=' + params.tmpPeriod +
      ((params.tmpOperator === null) ? '' : ((params.tmpMeasurementTypeKey === 'mobile') ? '&operator=' : '&provider=') + params.tmpOperator) +
      ((params.tmpTechnology === null) ? '' : '&technology=' + params.tmpTechnology) +
      '&map_options=' + params.mapOptions +
      '&point_diameter=' + (MAP.POINT_DIAMETER || vm.DEFAULT_POINT_DIAMETER),
      {maxZoom: 13, zIndex:2}
    );
  };

  vm.getStatisticLayer2 = function() {
    console.log('getStatisticLayer2');
    var params = vm.getLayerParams();

    return L.tileLayer.debounceTileLayer(
      MAIN.SERVER.MAP + '/tiles/points/{z}/{x}/{y}.png?' +
      'highlight=null' +
      '&statistical_method=' + params.tmpStatisticMethod +
      '&period=' + params.tmpPeriod +
      ((params.tmpOperator === null) ? '' : ((params.tmpMeasurementTypeKey === 'mobile') ? '&operator=' : '&provider=') + params.tmpOperator) +
      ((params.tmpTechnology === null) ? '' : '&technology=' + params.tmpTechnology) +
      '&map_options=' + params.mapOptions,
      '&point_diameter=' + (MAP.POINT_DIAMETER || vm.DEFAULT_POINT_DIAMETER),
      {maxZoom: 19, zIndex:2}
    );
  };

  // Municipalities
  vm.getStatisticLayer3 = function() {
    console.log('getStatisticLayer3');
    var params = vm.getLayerParams();

    return L.tileLayer.debounceTileLayer(
      MAIN.SERVER.MAP + '/tiles/shapes/{z}/{x}/{y}.png?' +
      'highlight=null' +
      '&statistical_method=' + params.tmpStatisticMethod +
      '&period=' + params.tmpPeriod +
      ((params.tmpOperator === null) ? '': ((params.tmpMeasurementTypeKey === 'mobile') ? '&operator=' : '&provider=') + params.tmpOperator) +
      ((params.tmpTechnology === null) ? '' : '&technology=' + params.tmpTechnology) +
      '&map_options=' + params.mapOptions +
      '&shapetype=' + vm.Filter.Layer,
      {maxZoom: 19, zIndex:2}
    );
  };

  vm.removeMapLayers = function() {
    if(vm.Map.hasLayer(vm.LayerStatistics2)){
      vm.Map.removeLayer(vm.LayerStatistics2);
    }
    if(vm.Map.hasLayer(vm.LayerStatistics1)){
      vm.Map.removeLayer(vm.LayerStatistics1);
    }
    if(vm.Map.hasLayer(vm.LayerStatistics3)){
      vm.Map.removeLayer(vm.LayerStatistics3);
    }
  };

  vm.filterChange = function() {
    $cookies.putObject('Filter', vm.Filter);
    vm.removeMapLayers();

    if (
      vm.Filter.Layer === 'whitespots' ||
      vm.Filter.Layer === 'settlements' ||
      vm.Filter.Layer === 'municipality' ||
      vm.Filter.Layer === 'regions'
    ) {
      vm.LayerStatistics3 = vm.getStatisticLayer3();
      console.log('Adding Layer 3');
      vm.Map.addLayer(vm.LayerStatistics3);
    } else {
      vm.LayerStatistics1 = vm.getStatisticLayer1();
      console.log('Adding Layer 1');
      vm.Map.addLayer(vm.LayerStatistics1);
      if(vm.Filter.Layer === 'automatic'){
        if(vm.Map.getZoom() >= vm.SwitchHeatmapZoom){
          vm.LayerStatistics2 = vm.getStatisticLayer2();
          console.log('Adding Layer 2');
          vm.Map.addLayer(vm.LayerStatistics2);
        }
      }
    }

    // do this to refresh map to avoid the appearance of grey tiles
    vm.Map.addLayer(vm.LayerMap);
    vm.Map.fire("move");
    setTimeout(function () {
      vm.Map.fire("move");
    }, 100);
    setTimeout(function () {
      vm.Map.fire("move");
      vm.Map.invalidateSize();
    }, 500);
  };

  vm.filterRedraw = function(measumentOption, measurementType){
    var availableFilters = ms.getAvailableFilters(measumentOption, ms);
    vm.StatisticMethods = availableFilters.statisticMethods;
    vm.Operators = availableFilters.operators;
    vm.Periods = availableFilters.periods;
    vm.Technologies = availableFilters.technologies;
    vm.Legend = ms.getLegend(measurementType);
    vm.Filter.Operator = vm.Operators[0];
    vm.Filter.Technology = vm.Technologies.slice();
  };

  vm.updateMeasumentTypes = function (option) {
    vm.MeasurementTypes = ms.getMeasurementTypes(option);
    vm.Filter.MeasurementType = vm.MeasurementTypes[0];
    vm.filterRedraw(option, vm.Filter.MeasurementType);
    vm.filterChange();
  };

  vm.mapChange = function(){
    $cookies.putObject('Filter', vm.Filter);
    if(vm.Map.hasLayer(vm.LayerMap)){
      vm.Map.removeLayer(vm.LayerMap);
    }
    vm.LayerMap = vm.getMapLayer();

    // do this to refresh map to avoid the appearance of grey tiles
    vm.Map.addLayer(vm.LayerMap);
    vm.Map.fire("move");
    setTimeout(function () {
      vm.Map.fire("move");
    }, 100);
    setTimeout(function () {
      vm.Map.fire("move");
    }, 500);
  };

  vm.showMarker = function(e){
    console.log("SHOW MARKER EVENT")
    if(
      (vm.Filter.Layer === 'points') ||
      (vm.Filter.Layer === 'automatic' && vm.Map.getZoom() >= vm.SwitchHeatmapZoom)
    ){
      var promise = ms.getMarkerData(e.latlng, vm.Map.getZoom(), vm.Filter, vm.getLayerParams());
      promise.then(function(data) {
        if(data.measurements.length > 0) {
          vm.MData = data.measurements;
          var linkFunction = $compile(angular.element(ms.PopUpHtml));
          vm.Map.panTo(e.latlng, {animate:true});
          var html = linkFunction($scope)[0];
          vm.PopUp = L.popup({minWidth:350,keepInView:true}).setLatLng(e.latlng).setContent(html).openOn(vm.Map);
        }
      }, function(reason) {}, function(update) {}).catch(function onError(response) { console.log('Error when panning: ' + response); });
    }
  };

  vm.getMapLayer = function(){
    switch(vm.Filter.MapType){
    case 'osm' :
      return ms.getLayerOpenStreetMap();
    case 'bing' :
      return ms.getLayerBing();
    case 'gr' :
      return ms.getLayerGoogleRoad();
    case 'gs' :
      return ms.getLayerGoogleSatelite();
    case 'gh' :
      return ms.getLayerGoogleHybrid();
    case 'mbbsc' :
      return ms.getLayerMapBox(MAP.MAPBOX_LAYERS.mbbsc);
    case 'mbstr' :
      return ms.getLayerMapBox(MAP.MAPBOX_LAYERS.mbstr);
    case 'mbsat' :
      return ms.getLayerMapBox(MAP.MAPBOX_LAYERS.mbsat);
    default:
      return ms.getLayerOpenStreetMap();
    }
  };

  vm.searchSuggestions = [];

  vm.search = function(e) {
    if (MAP.PROVIDER.HERE && MAP.PROVIDER.HERE.enabled) {
      fetch('https://geocode.search.hereapi.com/v1/geocode'
        + `?q=${e.target.value}`
        + `&at=${MAP.CENTER.LAT},${MAP.CENTER.LONG}`
        + `&in=countryCode:${MAP.PROVIDER.HERE.countryCode}`
        + '&limit=10'
        + `&apiKey=${MAP.PROVIDER.HERE.key}`
      )
        .then(resp => resp.json())
        .then(json => {
          vm.searchSuggestions = json.items;
        });
    } else if (MAP.PROVIDER.MAPBOX && MAP.PROVIDER.MAPBOX.enabled) {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${e.target.value}.json?access_token=${MAP.PROVIDER.MAPBOX.key}`)
        .then(resp => resp.json())
        .then(json => {
          vm.searchSuggestions = json.features;
        });
    }
  };

  vm.getAddress = loc => loc.title || loc.place_name;

  vm.filterBySearch = function(loc){
    const lng = loc.position
      ? loc.position.lng
      : loc.center
        ? loc.center[0]
        : 0;
    const lat = loc.position
      ? loc.position.lat
      : loc.center
        ? loc.center[1]
        : 0;
    let zoom = 18;
  
    if (loc.mapView) {
      const { mapView: mv } = loc;
      vm.Map.fitBounds([
        [mv.south, mv.east],
        [mv.north, mv.west]
      ]);
      zoom = vm.Map.getZoom();
    } else if (loc.bbox) {
      vm.Map.fitBounds([
        loc.bbox.slice(0, 2).reverse(),
        loc.bbox.slice(2).reverse()
      ]);
      zoom = vm.Map.getZoom();
    } else {
      vm.Map.flyTo(new L.LatLng(lat, lng), zoom, { animate: false });
    }

    $cookies.putObject('Location', { address: this.getAddress(loc), lat, lng, zoom });
    vm.searchSuggestions = [];
    document.querySelector('#srchinput').value = this.getAddress(loc);
  };

  vm.initMapLayers = function(){
    vm.MeasurementOptions = ms.MeasurementOptions;
    vm.MeasurementTypes = ms.MeasurementTypes;
    vm.StatisticMethods = ms.StatisticMethods;
    vm.Periods = ms.Periods;
    vm.Operators = ms.Operators;
    vm.Technologies = ms.Technologies;
    vm.Filter = ms.DefaultFilter;
    vm.LayerStatistics1 = vm.getStatisticLayer1();
    vm.LayerMap = vm.getMapLayer();
    vm.Map.addLayer(vm.LayerMap);
    vm.Map.addLayer(vm.LayerStatistics1);

    vm.Map.on('zoomend', vm.filterChange);
    if (MAIN.FEATURES.OPENDATA.IS_OPENDATA_ENABLED) {
      vm.Map.on('click', vm.showMarker);
    }
  };

  $scope.onTechnologySelect = {
    onSelectionChanged: function () { vm.filterChange(); }
  };

  vm.onTestServerChange = function () {
    $cookies.putObject('TestServer', { data: vm.TestServer });
    ms.TestServer = vm.TestServer;
  };
}]);

angular.module('nettestApp').service('mapService', ['$http', '$q', '$cookies', '$translate', 'userFactory', 'MAIN', 'MAP', function($http, $q, $cookies, $translate, userService, MAIN, MAP) {
  return {
    DefaultFilter : {
      Layer:'automatic',
      MapType:'gr',
      MeasurementType:{val:'mobile/download',name:'Mobile - Download'},
      MeasurementOption:{val:0,name:'Mobile'},
      StatisticMethod:{val:'0.5',name:'Median'},
      Period:{val:180,name:'6 months'},
      Operator:{val:'',name:'All networks'},
      Technology:{val:'',name:'2G/3G/4G'}
    },
    DefaultLayerTypes : [
      {val:'automatic'},
      {val:'heatmap'},
      {val:'points'}
    ],

    rspMapTypes : [],

    MeasurementTypes : [],
    MeasurementOptions : [],
    StatisticMethods : [],
    Periods : [],
    Operators : [],
    Technologies : [],
    MapTypes: [],
    PopUpHtml :
    '<section class="popup-data">'+
    ' <table ng-repeat="d in mapctrl.MData">'+
    '   <caption><strong>{{d.time_string}}</stong><a ui-sref="home.opentest({opentestuuid:d.open_test_uuid})" target="_blank" class="more-link" translate>details_info.info_detail</a></caption>'+
    '   <tr>'+
    '     <th clospan="3" translate>details_info.measurement_label</th>'+
    '   </tr>'+
    '   <tr ng-repeat="m in d.measurement" ng-if="m.value !== mapctrl.NO_INFO_SYMBOL && m.value !== undefined">'+
    '     <td>{{m.title}}</td>'+
    '     <td><span class="classification classification{{m.classification}}"></span></td>'+
    '     <td>{{m.value}}</td>'+
    '   </tr>'+
    '   <tr>'+
    '     <th clospan="3" translate>details_info.network_label</th>'+
    '   </tr>'+
    '   <tr ng-repeat="n in d.net" ng-if="n.value !== mapctrl.NO_INFO_SYMBOL && n.value !== undefined">'+
    '     <td>{{n.title}}</td>'+
    '     <td></td>'+
    '     <td>{{n.value}}</td>'+
    '   </tr>'+
    '   <tr ng-if="mapctrl.MAP.SHOW_DEVICE_INFO">'+
    '     <th clospan="3" translate>details_info.device_label</th>'+
    '   </tr>'+
    '   <tr ng-repeat="e in d.device" ng-if="mapctrl.MAP.SHOW_DEVICE_INFO && (e.value !== mapctrl.NO_INFO_SYMBOL && e.value !== undefined)">'+
    '     <td>{{e.title}}</td>'+
    '     <td></td>'+
    '     <td>{{e.value}}</td>'+
    '   </tr>'+
    ' </table>'+
    '</section>',

    TestServers: [],
    TestServer: null,

    getMapTypes: function(provider) {
      switch(provider) {
        case "GOOGLE": {
          return [
            {val:'gr',name:'Google road', default: true},
            {val:'gs',name:'Google satellite'},
            {val:'gh',name:'Google hybrid'},
          ]
        }
        case "MAPBOX": {
          return [
            {val:'mbbsc', name:'Basic', translate_value: "map.type.basic"},
            {val:'mbstr', name:'Streets', translate_value: "map.type.streets", default: true},
            {val:'mbsat', name:'Satellite', translate_value: "map.type.satellite"},
          ]
        }
      }
    },

    getPopUpHtml: function() {
      return PopUpHtml;
    },

    // OpenStreetMap Layers
    getLayerOpenStreetMap : function(){
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    },

    // Bing Layers
    getLayerBing : function(){
      return new L.BingLayer('An-mXOFmCCR7LA92NfrcSeOSEmxvZdGA_qqsDdOt6CuGIsQnarZHRJn2qP1FL75W', {type: 'Road'});
    },

    // GoogleMap Layers
    getLayerGoogleRoad : function(){
      return MAIN.FEATURES.GOOGLE_MUTANT ? L.gridLayer.googleMutant({maxZoom:24,type:'roadmap'}) : new L.Google('ROAD');
    },
    getLayerGoogleSatelite : function(){
      return MAIN.FEATURES.GOOGLE_MUTANT ? L.gridLayer.googleMutant({maxZoom:24,type:'satellite'}) : new L.Google('SATELLITE');
    },
    getLayerGoogleHybrid : function(){
      return MAIN.FEATURES.GOOGLE_MUTANT ? L.gridLayer.googleMutant({maxZoom:24,type:'hybrid'}) : new L.Google('HYBRID');
    },

    // MapBox Layers
    getLayerMapBox : function(style) {
      var gl = L.mapboxGL({
        accessToken: MAP.PROVIDER.MAPBOX.key,
        style: style
      })

      return gl;
    },

    getMapFilterData : function(scp){
      var self = this;

      var SERVER_MAP = MAIN.SERVER.MAP_NEW || MAIN.SERVER.MAP;

      var mapFilterDataReq = $http({
        method: 'POST',
        url: SERVER_MAP + "/tiles/info",
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({language: $translate.use()})
      });

      var operatorsDataReqMob = $http({
        method: 'POST',
        url: SERVER_MAP + "/tiles/mapFilterOperators",
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({
          language: $translate.use(),
          country_code: MAIN.FEATURES.STATISTICS_COUNTRY,
          provider_type: "MFT_MOBILE"
        })
      });
      var operatorsDataReqWlan = $http({
        method: 'POST',
        url: SERVER_MAP +  "/tiles/mapFilterOperators",
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({
          language: $translate.use(),
          country_code: MAIN.FEATURES.STATISTICS_COUNTRY,
          provider_type: "MFT_WLAN"
        })
      });

      var operatorsDataReqBrows = $http({
        method: 'POST',
        url: SERVER_MAP + '/tiles/mapFilterOperators',
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({
          language: $translate.use(),
          country_code: MAIN.FEATURES.STATISTICS_COUNTRY,
          provider_type: "MFT_BROWSER"
        })
      });
      var operatorsDataReqAll = $http({
        method: 'POST',
        url: SERVER_MAP + '/tiles/mapFilterOperators',
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({
          language: $translate.use(),
          country_code: MAIN.FEATURES.STATISTICS_COUNTRY,
          provider_type: "MFT_ALL"
        })
      });

      $q.all([mapFilterDataReq, operatorsDataReqMob, operatorsDataReqWlan, operatorsDataReqBrows, operatorsDataReqAll]).then(function (values) {
        var response = values[0].data;
        var operators = {
            mobile: values[1].data,
            wifi: values[2].data,
            browser: values[3].data,
            all: values[4].data,
        };

        self.response = Object.assign(response, {mapOperators: operators});

        self.MeasurementOptions = response.mapTypes;
        const storedFilter = $cookies.getObject('Filter') || scp.Filter;
        const initMeasumentOption = (storedFilter && storedFilter.MeasurementOption) || self.MeasurementOptions.find(a => a.default);

        self.MeasurementTypes = self.getMeasurementTypes(initMeasumentOption);
        scp.Legend = self.getLegend(self.MeasurementTypes[0]);

        var availableFilters = self.getAvailableFilters(initMeasumentOption);
        self.StatisticMethods = availableFilters.statisticMethods;
        self.Operators = availableFilters.operators;
        self.Periods = availableFilters.periods;
        self.Technologies = availableFilters.technologies;
        self.MapTypes = self.getMapTypes(MAP.DEFAULT_PROVIDER);

        self.DefaultFilter = self.getDefaultFilter(storedFilter);

        scp.initMapLayers();
      });
    },

    getDefaultFilter: function (storedFilter) {

      let defStattMethods = this.StatisticMethods.find(function (a) {
        return (storedFilter && storedFilter.StatisticMethod)
          ? (storedFilter.StatisticMethod.value == a.value)
          : a.default;
      });

      let defPeriod = this.Periods.find(function (a) {
        return (storedFilter && storedFilter.Period)
          ? (storedFilter.Period.period == a.period)
          : a.default;
      });

      let defTechnology = this.Technologies.filter(function (a) {
        return (storedFilter && storedFilter.Technology)
          ? storedFilter.Technology.some((t) => t.id == a.id)
          : a.default;
      });

      let defMeasurementType = this.MeasurementTypes.find(function (a) {
        return (storedFilter && storedFilter.MeasurementType)
          ? (storedFilter.MeasurementType.id == a.id)
          : a.default;
      });

      let defMeasurementOption = this.MeasurementOptions.find(function (a) {
        return (storedFilter && storedFilter.MeasurementOption)
          ? (storedFilter.MeasurementOption.id == a.id)
          : a.default;
      });

      let defOperatorOption = this.Operators.find(function (a) {
        return (storedFilter && storedFilter.Operator && storedFilter.Operator.id_provider)
          ? (storedFilter.Operator.id_provider == a.id_provider)
          : a.default;
      });
      
      return {
        Layer: storedFilter ? storedFilter.Layer : (MAIN.FEATURES.DEFAULT_MAP_OVERLAY || "automatic"),
        MapType: storedFilter ? storedFilter.MapType : (MAIN.FEATURES.DEFAULT_MAP_TYPE || this.MapTypes[1].val),
        MeasurementType: defMeasurementType,
        MeasurementOption: defMeasurementOption,
        StatisticMethod: defStattMethods,
        Period: defPeriod,
        Operator: defOperatorOption || {},
        Technology: defTechnology
      }
    },

    getLegend: function (measurementType) {
      return {
        legendcaption: measurementType.heatmap_captions,
        legendcolorstyle: {'background':'linear-gradient(90deg ,' + measurementType.heatmap_colors.toString() + ' )'}
      }
    },

    getMeasurementTypes: function (measurementOption) {
      var self = this;

      return measurementOption.mapSubTypeOptions.map(function (a) {
        return self.response.mapSubTypes[a];
      })
    },

    getAvailableFilters: function (measurementOption) {
      var statisticMethods = [];
      var operators = [];
      var periods = [];
      var technologies = [];

      if (measurementOption.mapCellularTypeOptions) {
        technologies = this.response.mapCellularTypes;
      }
      periods = this.response.mapPeriodFilters;
      statisticMethods = this.response.mapStatistics;
      operators = this.response.mapOperators[measurementOption.id].options;

      return {
        statisticMethods: statisticMethods,
        operators: operators,
        periods: periods,
        technologies: technologies
      }
    },

    getMarkerData: function(latlng, cz, filter, layerParams) {
      var deferred = $q.defer();
      $http({
        method: 'POST',
        url: MAIN.SERVER.MAP + '/tiles/markers',
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({
          coords: {
            lat: latlng.lat,
            lon: latlng.lng,
            z: cz
          },
          language: $translate.use(),
          filter: {
            highlight: undefined,
            operator: (layerParams.tmpOperator === '') ? undefined : layerParams.tmpOperator,
            period: layerParams.tmpPeriod,
            statistical_method: layerParams.tmpStatisticMethod,
            technology: (layerParams.tmpTechnology === '') ? undefined : layerParams.tmpTechnology
          },
          options:{
            map_options: layerParams.mapOptions
          }
        })
      }).then(function(response) {
        deferred.resolve(response.data);
      }, function(error) {
        console.log('Error retrieving marker data: %s', error);
      });
      return deferred.promise;
    },

    setTestServerList: function (scp) {
      var _self = this;

      this.getTestServersList(
        function (err) {
          console.warn(err);
        }, 
        function (data) {
          _self.TestServers = data.servers;
          const storedServer = $cookies.getObject('TestServer');
          _self.TestServer = storedServer && storedServer.data ? data.servers.find(server => storedServer.data.id === server.id ) : false;

          scp.TestServers = _self.TestServers;
          scp.TestServer = _self.TestServer;
        }
      );
    },

    getTestServersList: function(onError, onSuccess) {
      this.getLocation(console.warn, function (location) {

        $http({
          method: 'POST',
          url: MAIN.SERVER.CONTROL + '/V2/measurementServer',
          headers: {'Content-Type': 'application/json'},
          data: JSON.stringify({
            client: "RMBTws",
            language: $translate.use(),
            location: {
              altitude: location.coords.altitude,
              provider: location.coords.provider || "Browser",
              accuracy: location.coords.accuracy,
              geo_long: location.coords.longitude,
              speed: location.coords.speed,
              tstamp: location.timestamp,
              time_ns: 0,
              geo_lat: location.coords.latitude
            }
          })
        })
          .then(
            function(response) {
              if (onSuccess) {
                onSuccess(response.data);
              }
            },
            function(error) { 
              if (onError) {
                onSuccess({
                  "error": [
                    "string"
                  ],
                  "servers": [
                    {
                      "sponsor": "<organization>-SERVER-WEBSOCKET 1",
                      "country": "si",
                      "address": "example.org",
                      "distance": "? km",
                      "port": 443,
                      "city": "Ljubljana 1",
                      "id": 7
                    },
                  ]}
                );
              }
            }
          );
      });
    },

    getLocation: function (onError, onSuccess) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (location) {
            onSuccess && onSuccess(location);
          }, 
          function (error) {
            // onError && onError(error);
            onError && onSuccess({
              coords: {
                latitude: MAP.CENTER.LAT,
                longitude: MAP.CENTER.LONG,
                provider: "Customer default"
              },
              timestamp: +new Date()
            });
          }
      );
      } else {
        onError && onError("Geolocation is not supported by this browser.");
      }
    }
  };
}]);
