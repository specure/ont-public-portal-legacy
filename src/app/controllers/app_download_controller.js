angular.module('nettestApp').controller('AppDownloadController', [
  '$translate', 'MAIN',
  function($translate, MAIN){
    var vm = this;

    this.getIosUrl = function() {
      return MAIN.APP_URLS.ios;
    };

    this.getAndroidUrl = function() {
      return MAIN.APP_URLS.android;
    };

    this.getPlatform = function() {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/windows phone/i.test(userAgent)) {
        return 'Windows Phone';
      }

      if (/android/i.test(userAgent)) {
        return 'Android';
      }

      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'iOS';
      }

      return null;
    };

    this.getLang = () => $translate.use();

    this.shouldShowAsideBadges = () => MAIN.FEATURES.SHOW_ASIDE_BADGES;

    this.MAIN = MAIN;
  }]);