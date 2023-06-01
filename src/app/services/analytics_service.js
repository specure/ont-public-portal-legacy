angular.module('nettestApp').service('analyticsService', [
  '$cookies', '$rootScope', 'MAIN',
  function($cookies, $rootScope, MAIN) {
    this.disableAnalytics = () => {
      Object.keys($cookies.getAll()).forEach(key => {
        if (/^(_g(a|i)|_lfa)/.test(key)) {
          const hp = location.hostname.split('.');
          const domain = hp.length > 1
            ? `.${hp.slice(-2).join('.')}`
            : hp[0];
          $cookies.remove(key, { path: '/', domain });
        }
      });
    };

    this.analyticsEnabled = false;
    this.enableAnalytics = () => {
      if (this.analyticsEnabled) {
        return;
      }
  
      const head = document.querySelector('head');
      const { GOOGLE, GA4 }  = MAIN.FEATURES.ANALYTICS || {};

      // Analytics
      window['GoogleAnalyticsObject'] = 'ga';
      window.ga = window.ga || function() {
        (window.ga.q = window.ga.q || []).push(arguments);
      }, window.ga.l = 1 * new Date();
      let script = document.createElement('script');
      script.async = 1;
      script.src = 'https://www.google-analytics.com/analytics.js';
      head.appendChild(script);
      ga('create', GOOGLE, 'auto');
      ga('send', 'pageview');

      // Tag Manager
      script = document.createElement('script');
      script.async = 1;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4}`;
      head.appendChild(script);
  
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());  
      gtag('config', GA4);

      if (MAIN.FEATURES.SHOW_LEADFEEDER) {
        (function(){ window.ldfdr = window.ldfdr || {}; (function(d, s, ss, fs){ fs = d.getElementsByTagName(s)[0]; function ce(src){ var cs = d.createElement(s); cs.src = src; setTimeout(function(){fs.parentNode.insertBefore(cs,fs)}, 1); } ce(ss); })(document, 'script', 'https://sc.lfeeder.com/lftracker_v1_lAxoEaKR3eb4OYGd.js'); })(); 
      }
      
      this.analyticsEnabled = true;
    };

    this.checkIsCookieAllowed = () => {
      if (!window.NTCookieService || !window.NTCookieService.isCookieAccepted) {
        return;
      }
      window.NTCookieService.isCookieAccepted('analytics').then(allowed => {
        console.log("Analytics allowed?", allowed);

        if (!allowed) {
          this.disableAnalytics();
          return;
        }

        this.enableAnalytics();
      });
    };

    this.eventHandlersSet = false;
    this.setCookieEventHandlers = () => {
      if (!window.NTCookieService || !window.NTCookieService.addEventListener || this.eventHandlersSet) {
        return;
      }
      window.NTCookieService.addEventListener('consentUpdated', cookies => {
        if (cookies && cookies.some(c => c.key === 'analytics')) {
          location.reload();
        }
      });
      this.eventHandlersSet = true;
    };

    this.initAnalytics = () => {
      const { COOKIE_WIDGET } = MAIN.FEATURES;
      if (COOKIE_WIDGET && COOKIE_WIDGET.ENABLED) {
        this.checkIsCookieAllowed();
        this.setCookieEventHandlers();
        $rootScope.$on('cookieServiceReady', () => {
          this.checkIsCookieAllowed();
          this.setCookieEventHandlers();
        });
      } else {
        this.enableAnalytics();
      }
    };
  }]);