angular.module('nettestApp').service('advancedSearchService',[
  'countryService', '$filter', function(countryService, $filter) {
    var OPTIONS = {
      'download_kbit': {
        label: 'testresult.speed_download',
        label_end: 'unit.mbps',
        type: 'range',
        modifier: 1000
      },
      'upload_kbit': {
        label: 'testresult.speed_upload',
        label_end: 'unit.mbps',
        type: 'range',
        modifier: 1000
      },
      'ping_ms': {
        label: 'ping',
        label_end: 'unit.milliseconds',
        type: 'range'
      },
      'signal_strength': {
        label: 'testresult.signal_strength',
        label_end: 'unit.dBm',
        type: 'range'
      },
      'loc_accuracy': {
        label: 'testresult.loc_accuracy',
        label_end: 'unit.meters',
        type: 'range'
      },
      // TOTO - request by RU - disable ZIP code filter
      //'zip_code': {
      //		label: 'testresult.zip_code',
      //		type: 'range'
      //	},
      //'CLI':'CLI', - technology removed by customer's request - ticket SDRU-59
      'cat_technology': {
        label: 'testresult.cat_technology',
        type: 'select',
        options: {
          '2G':'2G',
          '2G/3G':'2G/3G',
          '2G/3G/4G':'2G/3G/4G',
          '2G/4G':'2G/4G',
          '3G':'3G',
          '3G/4G':'3G/4G',
          '4G':'4G',
          '5G':'5G',
          'LAN':'LAN',
          'MOBILE':'MOBILE',
          'WLAN':'WLAN'
        },
        hasAllOption:true
      },
      'ip_version': {
        label: 'testresult.ip_version',
        type: 'select',
        options: {
          '4': 'IPv4',
          '6': 'IPv6'
        },
        hasAllOption: true
      },
      'platform': {
        label: 'testresult.platform',
        type: 'select',
        options: {
          'Android': 'Android',
          'RMBTws': 'Web',
          'iOS': 'iOS'
        },
        hasAllOption: true
      },
      'model': {
        label: 'testresult.model',
        type: 'text'
      },
      'network_name': {
        label: 'testresult.network_name',
        type: 'text'
      },
      'network_country': {
        label: 'testresult.network_country',
        type: 'select',
        options: countryService.getCountriesObject(),
        hasAllOption: true
      },
      'provider_name': {
        label: 'testresult.provider_name',
        type: 'text'
      },
      'public_ip_as_name': {
        label: 'testresult.public_ip_as_name',
        type: 'text'
      },
      'asn': {
        label: 'testresult.asn',
        type: 'text'
      },
      'mobile_provider_name': {
        label: 'testresult.mobile_provider_name',
        type: 'text'
      },
      'sim_country': {
        label: 'testresult.sim_country',
        type: 'select',
        options: countryService.getCountriesObject(),
        hasAllOption: true
      },
      'sim_mcc_mnc': {
        label: 'testresult.sim_mcc_mnc',
        type: 'text'
      },
      'country_geoip': {
        label: 'testresult.country_geoip',
        type: 'select',
        options: countryService.getCountriesObject(),
        hasAllOption: true
      },
      'time': {
        label: 'testresult.time',
        type: 'custom.datepicker',
        dateFrom: 'undefined',
        dateTo: 'undefined'
      }
    };

    this.getOptions = function() {
      return OPTIONS;
    };

    this.unpackParams = function(params) {
      var result = {};
      for (var param in params) {
        param = decodeURI(param);
        var obj = params[param];
        if (angular.isArray(obj) && param !== 'time[]') {
          var range = {};
          var modifier = 1;
          if(OPTIONS[param]['modifier']) {
            modifier = OPTIONS[param]['modifier'];
          }
          var fromNumber = parseInt(obj[0].substr(1), 10) * (1/modifier);
          var toNumber = parseInt(obj[1].substr(1), 10) * (1/modifier);
          range[param]={ 'from' : fromNumber, 'to': toNumber};
          angular.merge(result, { range });
        }
        else if (param === 'time[]') {
          /*					var timeParam = {};
					timeParam['time'] = new Date(decodeURI(obj[1]));
					angular.merge(result, timeParam);
*/
        }
        else if (param=== 'timeFrom'){
          var timeParam = {};
          timeParam['time'] = params[param];
          angular.merge(result, timeParam);
        }
        else {
          var filterParam = {};
          filterParam[param] = obj;
          angular.merge(result, filterParam);
        }
      }
      
      return result;
    };

    this.packParams = function(params) {
      var searchParams = {};
      for (var param in params) {
        if (param === 'range') {
          var r = params['range'];
          for (var range in r) {
            var rangeParams = {};
            var modifier = 1;
            if(OPTIONS[range]['modifier']) {
              modifier = OPTIONS[range]['modifier'];
            }
            var fromNumber = parseInt(r[range]['from'] * modifier, 10);
            var toNumber = parseInt(r[range]['to'] * modifier, 10);

            rangeParams[range] = ['>' + fromNumber, '<' + toNumber];
            angular.merge(searchParams, rangeParams);
          }
        }
        else if (param === 'time') {
          var timeParam = {};
          timeParam[param] = params[param];
          angular.merge(searchParams, timeParam);
        }
        else {
          var simpleParam = {};
          simpleParam[param] = params[param];
          angular.merge(searchParams, simpleParam);
        }
      }

      return searchParams;
    };

    this.packParamsToString = function(params) {
      var paramString = '';
      for (var param in params) {
        if (param === 'range' ) {
          var r = params['range'];
          for (var range in r) {
            var fromValue = r[range]['from'];
            var toValue = r[range]['to'];

            if (fromValue || toValue) {
              var modifier = 1;
              if(OPTIONS[range]['modifier']) {
                modifier = OPTIONS[range]['modifier'];
              }
              var fromNumber = parseInt((fromValue ? fromValue : 0) * modifier, 10);
              var toNumber = parseInt((toValue ? toValue : fromValue + 1) * modifier, 10);

              paramString += '&' + range + '=' + encodeURIComponent('>') + fromNumber + '&' + range +'=' + encodeURIComponent('<') + toNumber;
            }
          }
        }
        else if (param === 'timeFrom' && params[param]) {
          paramString += '&' + dateQueryString('time', params[param], $filter);
        }
        else if (param ==='time'){
          paramString += '&' + dateQueryString('time', params[param], $filter);
        }
        else if (param === 'timeTo') { //ignorujem parameter
          //console.log('TimeTo ');
        }
        else if (params[param]) {
          paramString += '&' + param + '=' + encodeURIComponent(params[param]);
        }
      }

      return (paramString.substr(1));
    };
  }]);