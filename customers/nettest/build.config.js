/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
  /**
   * The `build_dir` folder is where our projects are compiled during
   * development and the `compile_dir` folder is where our app resides once it's
   * completely built.
   */
  build_dir: 'build',
  compile_dir: 'bin',

  /**
   * This is a collection of file patterns that refer to our app code (the
   * stuff in `src/`). These file paths are used in the configuration of
   * build tasks. `js` is all project javascript, less tests. `ctpl` contains
   * our reusable components' (`src/common`) template HTML files, while
   * `atpl` contains the same, but for our app's code. `html` is just our
   * main HTML file, `less` is our main stylesheet, and `unit` contains our
   * app's unit tests.
   */
  app_files: {
    js: [ 'src/app/**/*.js', '!src/app/customers/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js'],

    atpl: ['src/app/views/**/*.html'],
    //ctpl: [ 'src/common/**/*.tpl.html' ],

    html: [ 'src/index.html' ],
    less: 'src/less/schema/nettest.less' // this line is overwritten by Gruntfile.js
  },

  /**
   * This is the same as `app_files`, except it contains patterns that
   * reference vendor code (`vendor/`) that we need to place into the build
   * process somewhere. While the `app_files` property ensures all
   * standardized files are collected for compilation, it is the user's job
   * to ensure non-standardized (i.e. vendor-related) files are handled
   * appropriately in `vendor_files.js`.
   *
   * The `vendor_files.js` property holds files to be automatically
   * concatenated and minified with our project source files.
   *
   * The `vendor_files.css` property holds any CSS files to be automatically
   * included in our app.
   *
   * The `vendor_files.assets` property holds any assets to be copied along
   * with our app's assets. This structure is flattened, so it is not
   * recommended that you use wildcards.
   */
  vendor_files: {
    js: [
      'vendor/jquery/dist/jquery.js',
      'vendor/jstzdetect/jstz.js',
      'vendor/modernizr/modernizr.js',
      'vendor/angular/angular.js',
      'vendor/d3/d3.js',
      'vendor/n3-line-chart/build/line-chart.js',
      'vendor/angular-animate/angular-animate.js',
      'vendor/angular-responsive-tables/release/angular-responsive-tables.js',
      'vendor/angular-loading-bar/build/loading-bar.js',
      'vendor/angular-ui-router/release/angular-ui-router.js',
      'vendor/angular-translate/angular-translate.js',
      'vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      'vendor/angular-cookies/angular-cookies.js',
      'vendor/loglevel/dist/loglevel.js',
      'vendor/ng-dialog/js/ngDialog.js',
      'vendor/moment/moment.js',
      'vendor/moment/min/moment-with-locales.js',
      'vendor/angular-moment-picker/dist/angular-moment-picker.js',
      'vendor/moment-picker/dist/angular-moment-picker.js',
      'vendor/leaflet/dist/leaflet-src.js',
      'vendor/leaflet-fullscreen/dist/Leaflet.fullscreen.js',
      // 'lib/mapbox-gl.js',
      'lib/leaflet-mapbox-gl.js',
      'node_modules/ng-datepicker/src/js/ngDatepicker.js',
      'node_modules/daterangepicker/daterangepicker.js',
      'node_modules/angular-daterangepicker/js/angular-daterangepicker.min.js',

      ////

      // TODO: move test to own module, use directives
      //'src/vendor/websocket-test/deployJava.js',
      // 'websocket-test/RMBTWebsocketTestDataStructures.js',
      // 'websocket-test/RMBTWebsocketTest.js',
      // 'lib/gauge/createjs-2015.11.26.min.js',
      // 'lib/gauge/Gauge.js',
      // 'lib/gauge/gaugeCompiled.js',
      // 'lib/rmbtws/rmbtws.js',
      // 'lib/rmbtws/Visualization.js'
      'lib/rmbtws.js',
      'lib/DemoTestVisualization.js',
      'vendor/angularjs-dropdown-multiselect/dist/angularjs-dropdown-multiselect.min.js',
      'node_modules/@nettest/cookie-widget/dist/index.js'
    ],
    css: [
      'vendor/normalize.css/normalize.css',
      'vendor/angular-responsive-tables/release/angular-responsive-tables.css',
      'vendor/ng-dialog/css/ngDialog.css',
      'vendor/ng-dialog/css/ngDialog-theme-default.min.css',
      'vendor/angular-loading-bar/build/loading-bar.css',
      'vendor/bootstrap/dist/css/bootstrap.css',
      'vendor/font-awesome/css/font-awesome.min.css',
      'vendor/leaflet/dist/leaflet.css',
      'node_modules/ng-datepicker/src/css/ngDatepicker.css',
      'node_modules/daterangepicker/daterangepicker.css',
      'vendor/leaflet-fullscreen/dist/leaflet.fullscreen.css',
      'lib/mapbox-gl.css',
      'vendor/gauge/gauge.min.css',
      'node_modules/@nettest/cookie-widget/dist/styles.css'
    ],     
    resources: [
      'vendor/font-awesome/fonts/*',
      'vendor/leaflet-fullscreen/dist/fullscreen.png',
      'vendor/leaflet-fullscreen/dist/fullscreen@2x.png',
      'jar/RMBTClient-1.0.jar',
      'jar/RMBTClient-1.0.jnlp'
    ],         
    assets: [  
    ],
    external_scripts: [
      "https://api.tiles.mapbox.com/mapbox-gl-js/v0.54.0/mapbox-gl.js"
    ]
  },

  langs: ["de", "en", "sl"],

  UI: {
    CUSTOMER_NAME: "<organization>"
  }
};
