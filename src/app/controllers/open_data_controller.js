angular.module('nettestApp').controller('OpenDataController', ['MAIN', function(MAIN) {
  var vm = this;

  vm.selectedMonth = '0';

  vm.exportFormats = [
    {
      val: 'csv',
      name: 'CSV'
    },
    {
      val: 'json',
      name: 'JSON'
    },
    {
      val: 'xml',
      name: 'XML'
    }
  ];
  vm.exportFormat = vm.exportFormats[0];

  vm.exportDates = [];
  var startingDate = new Date(MAIN.FEATURES.OPENDATA.DATE_START);
  var endingDate = new Date();
  while (startingDate <= endingDate) {
    var month = (startingDate.getMonth()+1);
    vm.exportDates.push(startingDate.getFullYear() + '-' + (month >= 10 ? month : '0' + month));
    startingDate = new Date(startingDate.setMonth(startingDate.getMonth()+1));
  }
  vm.exportDates.push('-----');
  vm.exportDates.reverse();

  vm.downloadOpendata = function(val) {
    var dateIndex = +val;
    var exportFile = null;

    if (dateIndex === 0) {
      exportFile = 'nettest-opendata.' + vm.exportFormat.val;
    }
 
    if (dateIndex > 0) {
      var d = new Date(vm.exportDates[dateIndex]);
      var month = (d.getMonth()+1);
      exportFile = 'nettest-opendata-' + d.getFullYear() + '-' + (month >= 10 ? month : '0' + month) + '.' + vm.exportFormat.val;
    }

    exportFile && window.open(MAIN.SERVER.STATISTICS + '/export/' + exportFile);
  };
}]);