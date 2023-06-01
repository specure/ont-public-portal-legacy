angular.module('nettestApp').controller('TestResultController', [
  '$window', '$scope', '$state', '$stateParams', '$translate', '$filter', 'opentestResultService', 'qosResultService', 'userFactory', 'mapService', '$timeout', 'MAIN', 'MAP',
  function($window, $scope, $state, $stateParams, $translate, $filter, opentestResultService, qosResultService, userService, ms, $timeout, MAIN, MAP) {
    var vm = this;

    vm.convertTimeString = (str) => {
      // thats because currently we taking the date from API in wrong formatted string
      const [date, time] = str.split(' ');
      const [year, month, day] = date.split('-');
      if (!year | !month | !day) return str;
      return `${day}.${month}.${year} ${time}`;
    };

    vm.MapTypes = ms.getMapTypes(MAP.DEFAULT_PROVIDER);
    var defaultMap = vm.MapTypes.find(function (a) { return a.default; });
    vm.MapType = (defaultMap || {}).val || vm.MapTypes[0];

    const getChartHeight = () => $window.innerWidth <= 1200 ? Math.max($window.innerWidth / 4, 120) : 300;
    vm.chartHeight = getChartHeight();
    angular.element($window).on('resize', () => {
      vm.chartHeight = getChartHeight();
    });

    vm.getMapLayer = function() {
      switch(vm.MapType){
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

    vm.mapChange = function(){
      if(vm.Map.hasLayer(vm.LayerMap)){
        vm.Map.removeLayer(vm.LayerMap);
      }
      vm.LayerMap = vm.getMapLayer();
      vm.Map.addLayer(vm.LayerMap);
    };

    vm.onInitChart = function(){
      setTimeout(function(){
        var axis = d3.selectAll('.x.axis');
        var width = axis.node().getBBox().width;
        axis.append('text')
          .attr('dy', 30)
          .attr('dx', width /2 )
          .attr('text-anchor','middle');

        axis = d3.selectAll('.y.axis');
        var text = axis.append('text');
        var tWidth = text.node().getComputedTextLength();
        text.attr('dy', 15 )
          .attr('dx', -tWidth )
          .attr('text-anchor','start')
          .attr('transform','rotate(-90)')
        ;

      }, 100);
    };

    vm.initMap = function() {
      vm.showMap = true;

      $timeout(function() {
        var northEast = {lat: 84.83422451455144,lng: 276.328125},southWest={lat: -56.36525013685607,lng: -249.96093749999997};
        var bounds = L.latLngBounds(southWest, northEast);
        var loc = vm.result.speed_curve.location,
          line = {type: 'LineString',coordinates: []},
          i = 0;
        vm.Map = L.map('map',{maxBounds:bounds, scrollWheelZoom: false});
        vm.LayerMap = vm.getMapLayer();
        vm.Map.addLayer(vm.LayerMap);
        if(loc.length > 0 && loc[0].loc_accuracy <= 2000){
          for(i;i < loc.length;i++){
            line.coordinates.push([loc[i].long,loc[i].lat]);
          }
          var v = new L.LatLng(loc[0].lat, loc[0].long);
          vm.Map.setView([loc[0].lat, loc[0].long], 17);
          if(loc.length>1){
            L.geoJson(line,{style:{'color': 'blue','weight': 5}}).addTo(vm.Map);
          }
          L.geoJson(
            {type: 'Point',coordinates: [loc[loc.length-1].long, loc[loc.length-1].lat]},
            {pointToLayer: function (feature, latlng) { return L.circleMarker(latlng, {radius: 6,fillColor: 'blue',weight: 1,opacity: 1,fillOpacity: 0.8});}}
          ).addTo(vm.Map);

        } else {
          vm.showMap = false;
        }
      }, 1000);
    };

    vm.result = {};
    vm.resultOpenTestUuid = $stateParams.opentestuuid;
    vm.resultTestUuid = $stateParams.testuuid;

    vm.getValue = function(key) {
      var i = key.indexOf('.');
      if (i >= 0) {
        var first = vm.result[key.substr(0,i)];
        if (first) {
          return first[key.substr(i+1)];
        } else {
          return 0;
        }
      }
      else {
        return vm.result[key];
      }
    };

    var dbmSignalFormatterFn = function(x, y, series) {
      if (y>=0) {
        return 'n/a';
      }

      return y + ' dBm @ ' + (x/1000).toFixed(2) + ' s';
    };

    var rsrpSignalFormatterFn = function(x, y, series) {
      if (y>=0) {
        return 'n/a';
      }

      return y + ' dBm (RSRP) @ ' + (x/1000).toFixed(2) + ' s';
    };

    var signalFormatterFn = function(x, y, series) {
      return series.tooltip(x, y, series);
    };

    var formatterFn = function(x, y, series) {
      return (y > 0 ? (logToSpeed(y)/1e6).toFixed(2) : '< 0.1') + ' Mbps @ ' + (x/1000).toFixed(2) + ' s';
    };

    var xLabelFn =  function(i) {
      if (((i/1000) > 4.5) && ((i/1000) < 6.0)) {
        return (i/1000).toFixed(1) + '[s]';
      }
      return (i/1000).toFixed(1);
    };

    var yLabels = {
      't0': '0.1',
      't0.25': '1.0',
      't0.5': '10',
      't0.75': '100',
      't1': '[Mbps]'
    };

    var yLabelFn = function(i) {
      return yLabels['t'+i];
    };

    var translateFilter = $filter('translate');

    vm.options = {
      uploadCurve: {
        axes: {
          x: { key: 'time_elapsed', labelFunction: xLabelFn },
          y: { type: 'linear', min:0, max:1, width:200, ticks: [0,0.25,0.5,0.75,1], labelFunction: yLabelFn }
        },
        series:[
          { y: 'bytes_diff', axis: 'y', type: 'area', drawDots: false, label: 'Upload; Mbps/s' }
        ],
        tooltip: {mode: 'none'},
        drawLegend: false
      },
      downloadCurve: {
        axes: {
          x: { key: 'time_elapsed', labelFunction: xLabelFn },
          y: { type: 'linear', min:0, max:1, width:200, ticks: [0,0.25,0.5,0.75,1], labelFunction: yLabelFn }
        },
        series:[
          { y: 'bytes_diff', axis: 'y', type: 'area', drawDots: false, label: 'Download; Mbps/s' }
        ],
        tooltip: {mode: 'none'},
        drawLegend: false
      },
      signalCurve: {
        axes: {
          x: { key: 'time_elapsed', labelFunction: xLabelFn },
          y: { type: 'linear', min:-120, max:-30, ticks: [-120, -100, -80, -60, -40]  }
        },
        series:[
        ],
        tooltip: {mode: 'none'}
      }
    };

    this.loadQosTest = function() {
      qosResultService.getQoSTest(vm.resultOpenTestUuid,
        function (done) {
          if (done && done['testresultdetail_desc']) {
            for (var j = 0; j < done['testresultdetail_testdesc'].length; j++) {
              var cat = done['testresultdetail_testdesc'][j];
              cat['_tests'] = [];
              cat['_summary'] = {'failure_count':0, 'success_count':0, 'total':0};
              for (var i = done['testresultdetail'].length-1; i>= 0; i--) {
                var qosTest = done['testresultdetail'][i];
                if (cat['test_type'] == qosTest['test_type'].toUpperCase()) {
                  qosTest['_sorted_desc_map'] = {};
                  for (var entry in qosTest['test_result_key_map']) {
                    var result = qosTest['test_result_key_map'][entry];
                    if (qosTest['_sorted_desc_map'][result] === undefined) {
                      qosTest['_sorted_desc_map'][result] = [];
                    }
                    qosTest['_sorted_desc_map'][result].push(entry);
                  }

                  if (qosTest['failure_count'] > 0) {
                    cat['_tests'].unshift(qosTest);
                  }
                  else {
                    cat['_tests'].push(qosTest);
                  }

                  cat['_summary']['failure_count'] += qosTest['failure_count'] > 0 ? 1 : 0;
                  // For subtests the total amount of tests can be less than the sum of failed + successful
                  //cat['_summary']['success_count'] += qosTest['success_count'] > 0 ? 1 : 0;
                  cat['_summary']['success_count'] += qosTest['success_count'] > qosTest['failure_count'] ? 1 : 0;
                  cat['_summary']['total']++;
                  //cat['_summary']['total'] = cat['_summary']['failure_count'] + cat['_summary']['success_count'];
                  done['testresultdetail'].splice(i, 1);
                }
              }
            }

            done['_testdesc'] = {};
            for (var k = 0; k < done['testresultdetail_desc'].length; k++) {
              var testDesc = done['testresultdetail_desc'][k];
              done['_testdesc'][testDesc.key] = testDesc;
            }
          }

          vm.qos = done;
        },
        function (error) {
          vm.qos = null;
        }
      );
    };

    this.getDetailValue = function(key) {
      return vm.result[key];
    };

    this.linkSpeedCurve = function(speedCurve) {
      var formatFilter = $filter('formatSpeedWithUnit');
      var lastTimeUl = -1000;
      angular.forEach(speedCurve, function(v, i) {
        if ((lastTimeUl + 100) < v['time_elapsed']) {
          lastTimeUl = v['time_elapsed'];
          var d = v['bytes_total'] / (125 * v['time_elapsed']);
          v['_speed'] = d.toFixed(2) + ' Mbps';
          v['_time_elapsed_in_s'] = (v['time_elapsed']/1000).toFixed(2) + ' s';
          v['_parsed_data_volume'] = formatFilter(v['bytes_total']);
          var dLog = speedToLog(d*1e6);
          v['bytes_diff'] = dLog;
        }
      });

      return speedCurve;
    };

    this.calcSpeedCurve = function(done) {
      var maxTime = done['time_ul_ms'];
      if (done['speed_curve'] && done['speed_curve']['download'] && done['speed_curve']['download'].length>1) {
        vm.linkSpeedCurve(done['speed_curve']['download']);

      }

      if (done['speed_curve'] && done['speed_curve']['upload'] && done['speed_curve']['upload'].length>0) {
        vm.linkSpeedCurve(done['speed_curve']['upload']);
        maxTime += Math.max(done['duration_upload_ms'], done['speed_curve']['upload'][done['speed_curve']['upload'].length-1]['time_elapsed']);
      }

      if (done['speed_curve'] && done['speed_curve']['signal']) {
        var lastSignal;

        var getSignalKey = function(item) {
          if (item['cat_technology'] && item['cat_technology'].includes('4G')) {
            return 'lte_rsrp';
          } else {
            return 'signal_strength';
          }
        };

        var getSignalType = function(item) {
          if (item['cat_technology'] && item['cat_technology'].includes('4G')) {
            return 'dBm (RSRP)';
          } else {
            return 'dBm';
          }
        };

        var getCurrentSignal = function(item) {
          return item[getSignalKey(item)];
        };

        var getLastLegalSignal = function(elements, index) {
          if (getCurrentSignal(elements[index-1] < 0)) {
            return getCurrentSignal(elements[index-1]);
          }

          var key = getSignalKey(elements[index-1]);

          for (var j=index-1; j>=0; j--) {
            var signal = elements[j][key];
            if (signal < 0) {
              return signal;
            }
          }

          return 0;
        };

        var getNextLegalSignal = function(elements, index) {
          if (getCurrentSignal(elements[index-1] < 0)) {
            return getCurrentSignal(elements[index]);
          }

          var key = getSignalKey(elements[index-1]);

          for (var j=index; j<elements.length; j++) {
            var signal = elements[j][key];
            if (signal < 0) {
              return signal;
            }
          }

          return 0;
        };

        var signal = 0;

        //new signal array index
        var si = 0;
        done['speed_curve']['_signal'] = {'signals':[], 'additional':[]};

        angular.forEach(done['speed_curve']['signal'], function(v, i) {
          var signalChange = false;

          v['_time_elapsed_in_s'] = (v['time_elapsed']/1000).toFixed(2) + ' s';

          if (lastSignal) {
            if (v['cat_technology'] != lastSignal['cat_technology']) {
              //maybe more differentiation...
              signalChange = true;

              if (signalChange) {
                var newItem = angular.extend({}, lastSignal);
                newItem['time_elapsed'] = v['time_elapsed'];

                signal = getCurrentSignal(newItem);
                if (signal >= 0) {
                  signal = getLastLegalSignal(done['speed_curve']['signal'],i);
                  if (signal >= 0) {
                    signal = getNextLegalSignal(done['speed_curve']['signal'],i);
                  }
                }

                if (signal < 0) {
                  newItem['_signal_strength'] = signal;
                  done['speed_curve']['_signal']['signals'][si].push(newItem);
                }

                done['speed_curve']['_signal']['signals'].push([]);

                si++;
              }
            }
            lastSignal = v;
          }
          else {
            lastSignal = v;
          }

          signal = getCurrentSignal(v);
          if (signal >= 0) {
            signal = getLastLegalSignal(done['speed_curve']['signal'],i+1);
            if (signal >= 0) {
              signal = getNextLegalSignal(done['speed_curve']['signal'],i+1);
            }
          }

          if (signal < 0) {
            if (done['speed_curve']['_signal']['signals'].length===0) {
              done['speed_curve']['_signal']['signals'].push([]);
            }

            v['_signal_strength'] = signal;
            v['_signal_strength_with_type'] = signal + ' ' + getSignalType(v);
            done['speed_curve']['_signal']['signals'][si].push(v);
          }
        });

        //signal array empty? set it to null
        if (done['speed_curve']['_signal']['signals'].length === 0) {
          done['speed_curve']['_signal']['signals'] = null;
        }
        else if (done['speed_curve']['_signal']['signals'].length === 1 && done['speed_curve']['_signal']['signals'][0].length === 1) {
          //only one signal item? add a copy of itself on the end of the test timeline
          var copySignal = angular.extend({}, done['speed_curve']['_signal']['signals'][0][0]);
          copySignal['time_elapsed'] = maxTime;
          copySignal['_time_elapsed_in_s'] = (copySignal['time_elapsed']/1000).toFixed(2) + ' s';
          done['speed_curve']['_signal']['signals'][0].push(copySignal);
        }

        if (done['speed_curve']['_signal']['signals']) {
          var lastIndex = done['speed_curve']['_signal']['signals'].length-1;
          var lastElementIndex = done['speed_curve']['_signal']['signals'][lastIndex].length-1;
          var lastElement = done['speed_curve']['_signal']['signals'][lastIndex][lastElementIndex];
          lastElement['time_elapsed'] = Math.max(maxTime, lastElement['time_elapsed']);
          lastElement['_time_elapsed_in_s'] = (lastElement['time_elapsed']/1000).toFixed(2) + ' s';

          done['speed_curve']['_signal']['additional'] = {
            'download': {
              'start': done['time_dl_ms'],
              'end': done['time_dl_ms'] + done['duration_download_ms']
            },
            'upload': {
              'start': done['time_ul_ms'],
              'end': done['time_ul_ms'] + done['duration_upload_ms']
            }
          };
        }
      }

      return done;
    };

    this.formatMeasurement = function(data) {
      var classify = {
        1: 'red',
        2: 'yellow',
        3: 'green'
      };
      if (MAIN.FEATURES.SHOW_JITTER) {
        data['_measurement'] = {
          'testresult.speed_download': {
            classification: 'classification-' + classify[data['download_classification']],
            value: (data['download_kbit']/1000).toFixed(2),
            unit: 'unit.mbps'
          },
          'testresult.speed_upload': {
            classification: 'classification-' + classify[data['upload_classification']],
            value: (data['upload_kbit']/1000).toFixed(2),
            unit: 'unit.mbps'
          },
          'testresult.signal_strength': {
            classification: 'classification-' + classify[data['signal_classification']],
            value: (data['signal_rsrp'] ? data['signal_rsrp'] : data['signal_strength']),
            unit: (data['signal_rsrp'] ? 'unit.dBmRsrp' : 'unit.dBm')
          },
          'testresult.ping': {
            classification: 'classification-' + classify[data['ping_classification']],
            value: data['ping_ms'].toFixed(0),
            unit: 'unit.milliseconds'
          },
          'testresult.jitter': {
            classification: 'classification-' + classify[data['jitter_classification']],
            value: data['jitter'],
            unit: 'unit.milliseconds'
          },
          'testresult.packet_loss': {
            classification: 'classification-' + classify[data['packet_loss_classification']],
            value: data['packet_loss'],
            unit: '%'
          }
        };
      } else {
        data['_measurement'] = {
          'testresult.speed_download': {
            classification: 'classification-' + classify[data['download_classification']],
            value: (data['download_kbit']/1000).toFixed(2),
            unit: 'unit.mbps'
          },
          'testresult.speed_upload': {
            classification: 'classification-' + classify[data['upload_classification']],
            value: (data['upload_kbit']/1000).toFixed(2),
            unit: 'unit.mbps'
          },
          'testresult.signal_strength': {
            classification: 'classification-' + classify[data['signal_classification']],
            value: (data['signal_rsrp'] ? data['signal_rsrp'] : data['signal_strength']),
            unit: (data['signal_rsrp'] ? 'unit.dBmRsrp' : 'unit.dBm')
          },
          'testresult.ping': {
            classification: 'classification-' + classify[data['ping_classification']],
            value: data['ping_ms'].toFixed(0),
            unit: 'unit.milliseconds'
          }
        };
      }
      return data;
    };

    this.prepareOpendata = function(data) {
      data = vm.calcSpeedCurve(data);
      data = vm.formatMeasurement(data);

      return data;
    };

    if (vm.resultOpenTestUuid) {
      vm.detailViewKeys = opentestResultService.getOpenTestDetailViewKeys();
      vm.showSearchLinks = true;

      opentestResultService.getOpenTest(vm.resultOpenTestUuid,
        function (done) {
          done = vm.prepareOpendata(done);

          vm.result = done;
          vm.error = null;
          vm.initMap();
        },
        function (error) {
          vm.result = null;
          vm.error = error;
        });

      vm.loadQosTest();
    }
    else if (vm.resultTestUuid) {
      vm.showSearchLinks = MAIN.FEATURES.OPENDATA.IS_OPENDATA_ENABLED;
      userService.requestTestResult(vm.resultTestUuid,
        function (done) {
          if (done && done['testresult']) {
            vm.resultOpenTestUuid = done['testresult'][0]['open_test_uuid'];
            vm.error = null;

            opentestResultService.getOpenTest(vm.resultOpenTestUuid,
              function (done) {
                done = vm.prepareOpendata(done);
                vm.result['_measurement'] = done['_measurement'];

                if (done['speed_curve']) {
                  vm.result['speed_curve'] = done['speed_curve'];
                  vm.initMap();
                }
                vm.error = null;

                userService.requestTestResultDetails(vm.resultTestUuid,
                  function (data) {
                    if (!vm.result) {
                      vm.result = {};
                    }

                    if (data && data['testresultdetail']) {
                      var viewKeys = [];
                      angular.forEach(data['testresultdetail'], function(v, i) {
                        viewKeys.push(v.key);
                        vm.result[v.key] = v.value;
                      });

                      vm.detailViewKeys = userService.mergeTestDetailViewFunctionality(viewKeys);
                    }
                  });
              },
              function (error) {
                vm.result = null;
                vm.error = error;
              });

            vm.loadQosTest();
          }
        },
        function (error) {
          vm.result = null;
          vm.error = error;
        });
    }

    this.exportXlsx = function() {
      window.open(MAIN.SERVER.STATISTICS + '/report/test/' + vm.resultOpenTestUuid + '_' + $translate.use() + '.xlsx');
    };

    this.exportCsv = function() {
      window.open(MAIN.SERVER.STATISTICS + '/export/' + vm.resultOpenTestUuid);
    };

    this.exportPDF = async function() {
      let mainResults = [];
      if ($scope.resultctrl.result._measurement) {
        mainResults = await getMainResults($scope, $translate);
      }
      let testResults = [];
      if ($scope.resultctrl.detailViewKeys) {
        testResults = await getTestResults($scope, $translate, $filter, $state);
      }
      const qosCategories = $scope.resultctrl.qos && $scope.resultctrl.qos.testresultdetail_testdesc ? await getQosCategories($scope, $translate) : [];
      const downloadResults = await expandResults($scope.resultctrl.showDownloadTable, $scope.resultctrl.result.speed_curve.download, $translate);
      const uploadResults = await expandResults($scope.resultctrl.showUploadTable, $scope.resultctrl.result.speed_curve.upload, $translate);
      const resultsTableStyle = {
        fontSize: 8,
      };
      const docDefinition = {
        content: [
          {
            text: document.getElementById('articleHeader').textContent,
            style: 'articleHeader',
          },
          {
            text: await $translate('testresult._measurement_result'),
            style: 'measurementResultTitle',
          },
          ...(
            mainResults && mainResults.length > 0
              ? [
                {
                  layout: 'lightHorizontalLines',
                  table: {
                    body: mainResults,
                    widths: [ '50%', '50%'],
                  },
                  style: 'resultsTableMain',
                },
              ]
              : []
          ),
          ...(
            testResults && testResults.length > 0
              ? [
                {
                  layout: 'lightHorizontalLines',
                  table: {
                    body: testResults,
                    widths: [ '30%', '70%'],
                  },
                  style: 'resultsTableMain',
                },
              ]
              : []
          ),
          ...(qosCategories || []),
          ...(
            $scope.resultctrl.result.speed_curve.download &&
            $scope.resultctrl.result.speed_curve.download.length>0
              ? [
                {
                  text: await $translate('download'),
                  style: 'measurementResultTitle',
                },
                {
                  image: svgToPNG('#chart_download--hidden').img,
                  width: 520,
                  style: 'chart',
                }
              ]
              : []
          ),
          ...(downloadResults.length > 0
            ? [
              {
                layout: 'lightHorizontalLines',
                table: {
                  body: downloadResults,
                  widths: [ '30%', '30%', '30%'],
                },
                style: 'resultsTable',
              }
            ]
            : []
          ),
          ...(
            $scope.resultctrl.result.speed_curve.upload &&
            $scope.resultctrl.result.speed_curve.upload.length>0
              ? [
                {
                  text: await $translate('upload'),
                  style: 'measurementResultTitle',
                },
                {
                  image: svgToPNG('#chart_upload--hidden').img,
                  width: 520,
                  style: 'chart',
                }
              ]
              : []
          ),
          ...(uploadResults.length > 0
            ? [
              {
                layout: 'lightHorizontalLines',
                table: {
                  body: uploadResults,
                  widths: [ '30%', '30%', '30%'],
                },
                style: 'resultsTable',
              }
            ]
            : []
          ),
        ],
        styles: {
          articleHeader: {
            fontSize: 14,
            alignment: 'center',
            margin: [0,8,0,-16],
          },
          chart: {
            alignment: 'center',
            margin: [0, 8, 0, -36],
          },
          link: {
            color: 'blue',
          },
          measurementResultTitle: {
            fontSize: 12,
            margin: [0, 48, 0, 0],
          },
          testResultTitle: {
            bold: true,
            fontSize: 8,
            margin: [0, 16, 0, 4],
          },
          testResultDesc: {
            fontSize: 8,
            margin: [0, 4],
          },
          testResultDescInset: {
            fontSize: 8,
            margin: 0,
          },
          resultsTableMain: Object.assign({}, resultsTableStyle, {
            margin: [0, 8, 0, -16 ],
          }),
          resultsTable: Object.assign({}, resultsTableStyle, {
            margin: [0, 8, 0, 48],
          }),
        },
      };
      pdfMake.createPdf(docDefinition).download(`${vm.resultOpenTestUuid || 'file'}.pdf`);
    };

    $scope.$on('handleLanguageChange', function() {
      vm.loadQosTest();
    });
  }]);

function svgToPNG(selector) {
  const chart = {};
  chart.el = document.querySelector(selector);
  if (!chart.el) return chart;
  const canvas = document.getElementById('canvas_printer');
  canvg(canvas, chart.el.innerHTML);
  chart.img = canvas.toDataURL('image/png');
  return chart;
}

async function expandResults(shouldShow, results, $translate) {
  if(!shouldShow || !results || results.length <= 0) return [];
  const downloadResults = [];
  try {
    downloadResults.push(
      await Promise.all(
        [
          $translate('testresult.time'),
          $translate('testresult.speed_download'),
          $translate('testresult.data_volume')
        ]
      ).map(text => (
        {text, style: 'testResultTitle'}
      ))
    );
    results.forEach((res) => {
      if (res._speed) {
        downloadResults.push([
          res._time_elapsed_in_s,
          res._speed,
          res._parsed_data_volume,
        ]);
      }
    });
  } catch(err) {
    console.warn(err);
  }
  return downloadResults;
}

async function getMainResults($scope, $translate) {
  let mainResults = [];
  try {
    mainResults = await Promise.all(
      Object.entries($scope.resultctrl.result._measurement).map(async ([mKey, mValue]) => {
        if(mValue.value && mValue.value !== '-') {
          const key = await $translate(mKey);
          const unit = mValue.unit === '%' ? mValue.unit : await $translate(mValue.unit);
          const res = [
            key, `${mValue.value} ${unit}`,
          ];
          return res;
        }
        return null;
      })
    ).filter(val => val);
  } catch(err) {
    console.warn('err', err);
  }
  return mainResults;
}

async function getTestResults($scope, $translate, $filter, $state) {
  const testResults = [];
  const testResultTitle = await Promise.all(
    [
      $translate('testresult._result'),
      $translate('testresult._detail_click_info')
    ]
  );
  try {
    if (testResultTitle && testResultTitle.length > 0) {
      testResults.push(
        [
          {
            text: `${testResultTitle[0]} (${testResultTitle[1]})`,
            style: 'testResultTitle',
          },
          ''
        ]
      );
    }
    testResults.push(
      ...(
        await Promise.all(
          Object.entries($scope.resultctrl.detailViewKeys).map(async ([key, options]) => {
            if(!$scope.resultctrl.getValue(key)) return null;
            const val = $scope.resultctrl.getValue(key);
            const newKey = await $translate('testresult.' + key);
            let newValue = null;
            if (options) {
              newValue = (options.search && !options.disabled && $scope.resultctrl.showSearchLinks)
                ? options.search(options.key ? options.key : key, val)
                : val;
              if (newValue && typeof newValue === 'object') {
                const newEntry = Object.entries(newValue)[0];
                newValue = {
                  text: parseResultValue($filter)(val, options),
                  link: `${$state.href('home.search', {}, {absolute: true})}?${newEntry[0]}=${newEntry[1]}`,
                };
              } else if (newValue.length && newValue.indexOf('timeFrom') > -1) {
                newValue = {
                  text: parseResultValue($filter)(val, options),
                  link: `${$state.href('home.search', {}, {absolute: true})}?${newValue}`,
                };
              }
            }
            return [
              newKey, newValue || val,
            ];
          })
        ).filter(val => val)
      )
    );
  } catch(err) {
    console.warn(err);
  }
  return testResults;
}

async function getQosCategories($scope, $translate) {
  const qosTitle = $scope.resultctrl.qos.testresultdetail_testdesc ? await $translate('testresult._qos') : null;
  if (!qosTitle) return [];
  const getTest = (test) => (
    [
      {
        text: test.failure_count > 0 ? '-' : '+',
        style: 'testResultDesc',
      },
      {
        text: test.test_summary,
        style: 'testResultDesc',
      },
      {
        layout: 'lightHorizontalLines',
        table: {
          body: test.test_result_keys.map(getResult),
          widths: ['1%', '99%'],
        },
        style: 'testResultDescInset',
      },
      {
        text: test.test_desc,
        style: 'testResultDescInset',
      }
    ]
  );

  const getResult = (resultDesc) => (
    $scope.resultctrl.qos._testdesc[resultDesc] ? [
      $scope.resultctrl.qos._testdesc[resultDesc].status === 'fail' ? '-' : '+',
      $scope.resultctrl.qos._testdesc[resultDesc].desc,
    ] : ['', '']
  );

  return [
    {
      text: qosTitle,
      style: 'measurementResultTitle',
    },
    ...$scope.resultctrl.qos.testresultdetail_testdesc.flatMap(cat => (
      [
        {
          text: `${cat.name} ${cat._summary.success_count}/${cat._summary.total}`,
          style: 'testResultTitle',
        },
        {
          text: cat.desc,
          style: 'testResultDesc',
        },
        ...(
          cat._show ? [
            {
              table: {
                body: cat._tests.map(getTest),
                widths: ['1%', '33%', '33%', '33%'],
              }
            }
          ] : []
        ),
      ]
    ))
  ];
}