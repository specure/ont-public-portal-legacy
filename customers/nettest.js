angular.module('nettestApp')
  .constant('MAIN', {
    /**
		 * page title
		 * @type {String}
		 */
    TITLE: 'Open Nettest',

    /**
		 * preferred/default language
		 * @type {String}
		 */
    PREFERRED_LANGUAGE: 'sl',

    /**
		 * customer/company name
		 * @type {String}
		 */
    NAME: '<organization>',

    /**
		 * customer ID (like compile directive)
		 * @type {String}
		 */
    CUSTOMER_ID: 'NETTEST',

    /**
		 * client app name for RMBT Control Server
		 * @type {String}
		 */
    APP_NAME: '<organization>',

    /**
		 * link to customer's page (logo in footer)
		 * @type {String}
		 */
    LINK: 'http://example.org',

    /**
		 * display customer/company name below logo in footer
		 * @type {Boolean}
		 */
    LINK_SUBTITLE_ENABLED: false,

    /**
		 * languages available in settings (=on website)
		 * order in this array = order on website
		 * @type {Array}
		 */
    LANGUAGES: [
      {
        code: 'en',
        translation: 'lang.lang_english'
      },
      {
        code: 'sl',
        translation: 'lang.lang_slovenian'
      }
    ],

    /** @type {Object} special (customer-dependent) features */
    FEATURES: {
      /**
			 * enables or disables the warning dialog for data consumption
			 * to edit the default warning or add other languages change: customers/{customer}/views/lang_components/data_consumption_warning.adoc
			 * @type {Boolean}
			 */
      DATA_CONSUMPTION_WARNING: false,

      /**
			 * enables or disables the disclaimer (beta-warning) on top of the menu bar
			 * @type {Boolean}
			 */
      SHOW_DISCLAIMER: true,
      SHOW_OPENDATA_DISCLAIMER: true,
      SHOW_OPENDATA_SOURCE_DISCLAIMER: true,
      SHOW_APP_DOWNLOAD: true,
      SHOW_PRIVACY_POLICY: true,
      SHOW_TERMS_OF_USE: false,
      SHOW_TEASER: true,
      SHOW_JITTER: true,
      SHOW_METHODOLOGY: true,
      GOOGLE_MUTANT: true,
      SHOW_WIZARD: true,
      IS_JAVA_CLI_ENABLED: true,
      SHOW_ALL_OPERATORS: false,
      SHOW_INTERMEDIATE_RESULTS: true,
      SHOW_COOKIES: false,
      SHOW_ABOUT: true,
      STATISTICS_COUNTRY: "si",

      INITIAL_HOME_SCREEN: 'Map',
      /**
			 * enables or disables advertised speed feature
			 * @type {Boolean}
			 */
      ADVERTISED_SPEED_OPTION: {
        enabled: false,
        has_i_dont_know_option: true
      },

      ANALYTICS: {
        GOOGLE: 'UA-000000000-0',
        GA4: 'G-0000000000'
      },

      /**
			 * enables or disables open data accessibility (statistics, search)
			 */
      OPENDATA: {
        IS_OPENDATA_ENABLED: true,
        DATE_START: '2015-12'
      },

      IS_LOOP_MODE_ENABLED: true,
      LOOP_MODE_MIN_INTERVAL: 5,

      /* map layer select type, possible values: "dropdown", "checkboxes". Default - "checkboxes" */
      MAP_LAYER_SELECT_TYPE: "dropdown",
      
      DEFAULT_MAP_TYPE: "mbstr",

      SHOW_TERMS_AND_CONDITIONS_POPUP: true,

      /* show last 10 measuments section on statistics page: default - false */
      SHOW_RECENT_TESTS_ON_STATISTIC_PAGE: true,
      
      /* Show test server select on main page. Default - false */
      TEST_SERVER_SELECT: false,

      COOKIE_WIDGET: {
        ENABLED: ENV.MAIN.FEATURES.COOKIE_WIDGET.ENABLED,
        PROJECT_SLUG: 'nt',
        API_URL: ENV.MAIN.FEATURES.COOKIE_WIDGET.API_URL,
        AVAILABLE_LANGS: [
          { iso: 'en', name: 'English' },
          { iso: 'sl', name: 'Slovenščina' }
        ],
        DEFAULT_LANG: 'sl',
        THEME: {
          altTextColor: '#ffffff',
          backgroundColor: '#0971ce',
          buttonColor: '#000000',
          disabledSwitchColor: '#000000',
          disabledSwitchButtonColor: '#adc7de',
          dropdownColor: '#0f518a',
          linkColor: '#000000',
          textColor: '#ffffff'
        }
      }
    },

    HOST: ENV.MAIN.HOST,
    SERVER: ENV.MAIN.SERVER,

    DEFAULT_SEARCH_PARAMS: {
      'uuid': null,
      'language': 'sl',
      'timezone': 'Europe/Vienna',
      'type': 'mobile',
      'metric': '0.5',
      'network_type_group': 'all',
      'max_devices': 100,
      'location_accuracy': '2000',
      'country': 'si',
      'province': null,
      'end_date': null
    },
    APP_URLS: {
      "ios":"https://itunes.apple.com/us/app/<organization>/<id>",
      "android":"https://play.google.com/store/apps/details?id=<id>"
    },
    
    CLYM: {
      ENABLED: false
    },

    THREADS: {
      UPLOAD: {
        0: 1,
        1: 3,
        100: 10
      },
      DOWNLOAD: {
        0: 1,
        1: 3,
        100: 10
      }
    }
  })

  .constant('MAP', {
    /** @type {Object} center of map in map view */
    CENTER: {
      LAT: 46.164340,
      LONG: 14.945728
    },

    /* map init bounds */
    BOUNDS: [
      [46.866, 13.399],
      [45.441, 16.584]
    ],

    /**
		 * initial zoom in map view
		 * @type {Number}
		 */
    INITIAL_ZOOM: 9,
    MAX_ZOOM: 18,
    /**
		 * available map providers
		 * @type {Object}
		 */
    PROVIDER: {
      GOOGLE: ENV.MAP.PROVIDER.GOOGLE,
      MAPBOX: ENV.MAP.PROVIDER.MAPBOX,
      HERE: {
        key: '<here_api_key>',
        enabled: false
      }
    },

    /**
		 * the default map provider
		 * @type {String}
		 */
    DEFAULT_PROVIDER: 'MAPBOX',

    /**
		 * Marker info content
		 * @type {Boolean}
		 */
    SHOW_DEVICE_INFO: true,

    /**
		 * Avaliable layer types
		 * @type {Array<{val: string}>}
		 */
    LAYER_TYPES: [
      {val:'automatic'},
      {val:'heatmap'},
      {val:'points'},
      {val:'regions'},
      {val:'municipality'},
      {val:'settlements'},
      {val:'whitespots'}
    ],

    /**
		 * Point diameter
		 * @type {Array<{val: string}>}
		 */
    // POINT_DIAMETER: 16

    MAPBOX_LAYERS: {
      mbbsc: 'mapbox://styles/<account>/<id>',
      mbstr: 'mapbox://styles/<account>/<id>',
      mbsat: 'mapbox://styles/<account>/<id>',
    }
});
