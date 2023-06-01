angular.module('nettestApp').service('localizationService', [
  '$translate', function($translate) {
    this.updateIntervalLocale = function(translatedLocale) {
      // Make it more robust. eg. create a loop that takes n number of date entries.
      var options = {
        locale: {
          applyLabel: translatedLocale['datetime.apply'],
          cancelLabel: translatedLocale['datetime.cancel'],
          customRangeLabel: translatedLocale['datetime.custom_range']
        },
        ranges: {}
      };
      options.ranges[translatedLocale['datetime.today']] = [moment().locale($translate.use()), moment().locale($translate.use())];
      options.ranges[translatedLocale['datetime.yesterday']] = [moment().locale($translate.use()).subtract(1, 'days'), moment().locale($translate.use()).subtract(1, 'days')];
      options.ranges[translatedLocale['datetime.last_7_days']] = [moment().subtract(6, 'days'), moment()];
      options.ranges[translatedLocale['datetime.last_30_days']] = [moment().subtract(29, 'days'), moment()];
      options.ranges[translatedLocale['datetime.this_month']] = [moment().startOf('month'), moment().endOf('month')];
      options.ranges[translatedLocale['datetime.last_month']] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
      return options;
    };
  }]);