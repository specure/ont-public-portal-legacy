var ENV = {
  MAIN: {
    FEATURES: {
      SHOW_DISCLAIMER: false,
      SHOW_APP_DOWNLOAD: true,
      TEST_SERVER_SELECT: false,
      COOKIE_WIDGET: {
        ENABLED: true,
        API_URL: '<API_URL>',
      }
    },

    HOST: {
      SERVER: '<SCHEME_HOST_PORT>',
      CONTROL: '<CONTROL_PATH>',
      MAP: '<MAP_PATH>',
      STATISTICS: '<STATISTIC_PATH>',
      SERVER_LIST: '<SERVER_LIST_PATH'
    },

    SERVER: {
      CONTROL: '<SCHEME_HOST_PORT_CONTROL_PATH>',
      STATISTICS: '<SCHEME_HOST_PORT_STATISTICS_PATH>',
      MAP: '<SCHEME_HOST_PORT_MAP_PATH>',
      MAP_NEW: "<SCHEME_HOST_PORT_MAP_NEW_PATH>"
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
  },
  MAP: {
    MAX_ZOOM: 18,
    PROVIDER: {
      GOOGLE: {
        key: '<key>',
        enabled: true
      },
      MAPBOX: {
        key: '<key>',
        enabled: true
      }
    }
  }
}
