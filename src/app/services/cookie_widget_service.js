angular.module('nettestApp').service('cookieWidgetService', [
  '$http', '$translate', 'MAIN', '$rootScope',
  function($http, $translate, MAIN, $rootScope) {
    this.project = null;
    this.initWidget = function() {
      const { COOKIE_WIDGET } = MAIN.FEATURES;
      if (!COOKIE_WIDGET || !COOKIE_WIDGET.ENABLED || this.project) {
        return;
      }
      const {API_URL, PROJECT_SLUG, AVAILABLE_LANGS: availableLangs, DEFAULT_LANG: defaultLang, THEME: theme} = COOKIE_WIDGET;
      $http.get(`${API_URL}/projects?slug=${PROJECT_SLUG}&_limit=1`)
        .then(resp => {
          const projects = resp && resp.data;
          if (!projects || !projects.length) {
            return;
          }
          this.project = projects[0];
          const activeLang = $translate.use();
          window.NTCookieWidget.init({
            api: {
              cookies: `${API_URL}/cookies/project/${this.project.id}`,
              cookieConsents: `${API_URL}/cookie-consents`,
              cookiePolicy: `${API_URL}/pages/project/${this.project.id}?menu_item.route=cookie-policy`,
              uiTranslations: `${API_URL}/ui-translations/locale`
            },
            i18n: { availableLangs, defaultLang, activeLang },
            theme
          });
          $rootScope.$broadcast('cookieServiceReady');
        })
        .catch(e => console.warn(e));
    };
  }]);