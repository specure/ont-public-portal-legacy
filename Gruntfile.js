module.exports = function (grunt) {

  //// command line options

  var CUSTOMER = (grunt.option('customer') || 'nettest');
  var ENV = (grunt.option('env') || 'prod');
  var WEBSERVER_PORT = (parseInt(grunt.option('port'), 10) || 0);
  var getCurrentTime = new Date();
  var getCurrentTimes = getCurrentTime.getFullYear().toString() + '-';
  var MonthFixed = getCurrentTime.getMonth() + 1;
  getCurrentTimes += MonthFixed.toString() + '-';
  getCurrentTimes += getCurrentTime.getDate().toString() + '_';
  getCurrentTimes += getCurrentTime.getHours().toString() + ':';
  getCurrentTimes += getCurrentTime.getMinutes().toString();

  var PROFILE = 'development';
  switch (grunt.option('profile')) {
  case 'prod':
  case 'production':
    PROFILE = 'production';
    //case "dev":
    //default:
    //  PROFILE = "development"
  }

  console.log(grunt.option('deploy'));
  switch (grunt.option('deploy')) {
  case 'alpha':
    console.log(deploy);
  }
  console.log('CUSTOMER: ' + CUSTOMER);
  console.log('PROFILE: ' + PROFILE);
  console.log('WEBSERVER_PORT: ' + WEBSERVER_PORT);

  var shell = require('shelljs');
  var exec = shell.exec('git describe --tags --abbrev=0')
  var version = exec.stdout || "";

  ////

  /**
   * Load required Grunt tasks. These are installed based on the versions listed
   * in `package.json` when you do `npm install` in this directory.
   */
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-json-merge');
  grunt.loadNpmTasks('grunt-prompt');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-jsdoc');
  //grunt.loadNpmTasks('grunt-asciidoctor');
  grunt.loadTasks('fixed-grunt-asciidoctor/tasks');
  grunt.loadNpmTasks('grunt-ssh');
  grunt.loadNpmTasks('grunt-rsync');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-transifex');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-contrib-obfuscator');
  grunt.loadNpmTasks('grunt-babel');

  var rewrite = require('connect-modrewrite');
  var rewriteFunction = function(connect, options, middlewares) {
    // the rules that shape our mod-rewrite behavior
    var rules = [
      '!\\.html|\\.js|\\.css|\\.svg|\\.woff|\\.ttf|\\.eot|\\.jp(e?)g|\\.png|\\.gif$ /index.html',
      '^/views/lang_components/([^/]+)(.*)$ /views/lang_components/$1$2',
      '^/views/lang_components/([^/]+)(.*)$ /views/lang_components$2'
    ];

    // add rewrite as first item in the chain of middlewares
    middlewares.unshift(rewrite(rules));

    return middlewares;
  };

  /**
   * Load in our build configuration file.
   */
  var userConfig = require('./customers/' + CUSTOMER + '/build.config.js', grunt);

  // load deploy config
  var deployConfig = require('./customers/' + CUSTOMER + '/deploy.config.js', grunt);
  if (deployConfig && deployConfig[ENV]) {
    deployConfig = deployConfig[ENV];
  }

  console.log(deployConfig);

  var rsaKeyPath = process.env['HOME'] + '/.ssh/id_rsa';
  var rsaKey = grunt.file.exists(rsaKeyPath) ? grunt.file.read(rsaKeyPath) : null

  var LangTaskConfig = createLangTaskConfig();

  /**
   * This is the configuration object Grunt uses to give each plugin its
   * instructions.
   */
  var taskConfig = {
    /**
     * We read in our `package.json` file so we can access the package name and
     * version. It's already there, so we don't repeat ourselves here.
     */
    pkg: grunt.file.readJSON('package.json'),

    //For grunt-ssh connection credentials. Should try remove at a later time.
    //secret: grunt.file.readJSON("/home/cpogolsha/.ssh/secret.json"),

    /**
     * The banner is the comment that is placed at the top of our compiled
     * source files. It is first processed as a Grunt template, where the `<%=`
     * pairs are evaluated based on this very configuration object.
     */
    //    meta: {
    //      banner:
    //        '/**\n' +
    //        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
    //        ' * <%= pkg.homepage %>\n' +
    //        ' *\n' +
    //        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
    //        ' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
    //        ' */\n'
    //    },

    /**
     * The directories to delete when `grunt clean` is executed.
     */
    clean: [
      '<%= build_dir %>',
      '<%= compile_dir %>'
    ],

    /**
     * The `copy` task just copies files from A to B. We use it here to copy
     * our project assets (images, fonts, etc.) and javascripts into
     * `build_dir`, and then to copy the assets to `compile_dir`.
     */
    copy: {
      copy_customer_views: {
        files: [
          {
            cwd: '<%= build_dir %>/customers/' + CUSTOMER + '/views/',
            src: ['**/*.html'],
            dest: '<%= build_dir %>/views/',
            expand: true
          }
        ]
      },
      compile_customer_views: {
        files: [
          {
            cwd: '<%= compile_dir %>/customers/' + CUSTOMER + '/views/',
            src: ['**/*.html'],
            dest: '<%= compile_dir %>/views/',
            expand: true
          }
        ]
      },
      customer_images: {
        files: [
          {
            cwd: 'customers/' + CUSTOMER + '/img/',
            src: ['**/*'],
            dest: '<%= build_dir %>/assets/img/',
            expand: true
          }
        ]
      },
      customer_i18n_images: {
        files: [
          {
            cwd: 'customers/' + CUSTOMER + '/views/lang_components/',
            src: ['**/*.png', '**/*.gif', '**/*.jpg', '**/*.jpeg'],
            dest: '<%= build_dir %>/assets/img/',
            expand: true,
          }
        ]
      },
      customer_src: {
        files: [
          {
            cwd: 'customers/' + CUSTOMER + '/src/',
            src: ['**/*.js'],
            dest: '<%= build_dir %>/src/',
            expand: true
          }
        ]
      },

      customer_footer: {
        files: [
          {
            cwd: 'customers/' + CUSTOMER + '/views/footer',
            src: ['**/*.html'],
            dest: '<%= build_dir %>/src/',
            expand: true
          }
        ]
      },

      build_qos_html: {
        files: [
          {
            src: [ '**' ],
            dest: '<%= build_dir %>/qos/',
            cwd: 'src/qos',
            expand: true
          }
        ]
      },
      compile_qos_html: {
        files: [
          {
            src: [ '**' ],
            dest: '<%= compile_dir %>/qos/',
            cwd: 'src/qos',
            expand: true
          }
        ]
      },
      build_app_assets: {
        files: [
          {
            src: [ '**' ],
            dest: '<%= build_dir %>/assets/',
            cwd: 'src/assets',
            expand: true
          }
        ]
      },
      build_vendor_assets: {
        files: [
          {
            src: [ '<%= vendor_files.assets %>' ],
            dest: '<%= build_dir %>/assets/',
            cwd: '.',
            expand: true,
            flatten: true
          }
        ]
      },
      build_appjs: {
        files: [
          {
            src: [ '<%= app_files.js %>'],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
      build_profilejs: {
        files: [
          {
            src: ['src/profiles/'+ PROFILE + '.js']
              .filter(function() {
                return true;
              }),
            dest: '<%= build_dir %>/src/app/profile.js'
          }
        ]
      },
      build_customerjs: {
        files: [
          {
            src: ['customers/'+ CUSTOMER + '.js']
              .filter(function() {
                return true;
              }),
            dest: '<%= build_dir %>/src/app/customer.js'
          }
        ]
      },
      build_vendorjs: {
        files: [
          {
            src: [ '<%= vendor_files.js %>' ],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
      build_vendorcss: {
        files: [
          {
            src: [ '<%= vendor_files.css %>' ],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          },          
          {
            src: ['*.css'],
            cwd: './src/less/vendor/',
            dest: '<%= build_dir %>/assets/',
            expand: true
          },
        ]
      },
      build_vendor_res: {
        files: [
          {
            //src: [ 'vendor/leaflet-fullscreen/dist/fullscreen.png' ],
            src: [ '<%= vendor_files.resources %>' ],
            dest: '<%= build_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
      bin_vendor_res: {
        files: [
          {
            //src: [ 'vendor/leaflet-fullscreen/dist/fullscreen.png' ],
            src: [ '<%= vendor_files.resources %>' ],
            dest: '<%= compile_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
      compile_assets: {
        files: [
          {
            src: [ '**' ],
            dest: '<%= compile_dir %>/assets',
            cwd: '<%= build_dir %>/assets',
            expand: true
          },
          {
            src: [ '<%= vendor_files.css %>' ],
            dest: '<%= compile_dir %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
    },

    /**
     * `grunt concat` concatenates multiple source files into a single file.
     */
    concat: {
      /**
       * The `build_css` target concatenates compiled CSS and vendor CSS
       * together.
       */
      build_css: {
        src: [
          '<%= vendor_files.css %>',
          '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css'
        ],
        dest: '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css'
      },

      /**
       * The `compile_js` target is the concatenation of our application source
       * code and all specified vendor source code into a single file.
       */
      compile_js: {
        /*options: {
          banner: '<%= meta.banner %>'
        },*/
        src: [
          '<%= vendor_files.js %>',
          'module.prefix',
          '<%= build_dir %>/src/**/*.js',
          '<%= html2js.app.dest %>',
          '<%= html2js.customer.dest %>',
          'module.suffix'
        ],
        dest: '<%= compile_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.js'
      },

      build_customerjs: {
        options: {
          footer: "angular.module('nettestApp').constant('VERSION', '" + version.replace(/\r?\n/g, "") + "');"
        },
        src: ['./customers/' + CUSTOMER + '_' + ENV + '.js', './customers/' + CUSTOMER + '.js'],
        dest: '<%= build_dir %>/src/app/customer.js'
      }
    },

    json_merge: LangTaskConfig,

    /**
     * `ngAnnotate` annotates the sources before minifying. That is, it allows us
     * to code without the array syntax.
     */
    ngAnnotate: {
      compile: {
        files: [
          {
            src: [ '<%= app_files.js %>' ],
            cwd: '<%= build_dir %>',
            dest: '<%= build_dir %>',
            expand: true
          }
        ]
      }
    },

    babel: {
      dist: {
        files: [
          {
            '<%= build_dir %>/src/app/app.js': '<%= build_dir %>/src/app/app.js',
            '<%= build_dir %>/src/app/map.js': '<%= build_dir %>/src/app/map.js'
          },
          {
            expand: true,
            cwd: '<%= build_dir %>/src/app/controllers',
            src: ['*.js'],
            dest: '<%= build_dir %>/src/app/controllers'
          },
          {
            expand: true,
            cwd: '<%= build_dir %>/src/app/services',
            src: ['*.js'],
            dest: '<%= build_dir %>/src/app/services'
          }
        ]
      }
    },

    /**
     * Minify the sources!
     */
    uglify: {
      compile: {
        /*options: {
          banner: '<%= meta.banner %>'
        },*/
        files: {
          '<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
        }
      }
    },

    /**
     * `grunt-contrib-less` handles our LESS compilation and uglification automatically.
     * Only our `main.less` file is included in compilation; all other files
     * must be imported from this file.
     */
    less: {
      build: {
        files: {
          '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css': 'customers/' + CUSTOMER + '/less/main.less' //'<%= app_files.less %>'
        }
      },
      compile: {
        files: {
          '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css': 'customers/' + CUSTOMER + '/less/main.less' //'<%= app_files.less %>'
        },
        options: {
          cleancss: true,
          compress: true
        }
      }
    },

    /**
     * `jshint` defines the rules of our linter as well as which files we
     * should check. This file, all javascript sources, and all our unit tests
     * are linted based on the policies listed in `options`. But we can also
     * specify exclusionary patterns by prefixing them with an exclamation
     * point (!); this is useful when code comes from a third party but is
     * nonetheless inside `src/`.
     */
    jshint: {
      src: [
        '<%= app_files.js %>'
      ],
      gruntfile: [
        'Gruntfile.js'
      ],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true
      },
      globals: {}
    },

    /**
     * HTML2JS is a Grunt plugin that takes all of your template files and
     * places them into JavaScript files as strings that are added to
     * AngularJS's template cache. This means that the templates too become
     * part of the initial payload as one JavaScript file. Neat!
     */
    html2js: {
      /**
       * These are the templates from `src/app`.
       */
      app: {
        options: {
          base: 'src/app'
        },
        src: [ '<%= app_files.atpl %>' ],
        dest: '<%= build_dir %>/templates-app.js'
      },

      /**
       * These are the templates from `src/common`.
       */
      customer: {
        options: {
          base: 'customers/' + CUSTOMER
        },
        src: [ 'customers/' + CUSTOMER + '/views/footer.html' ],
        dest: '<%= build_dir %>/templates-customer.js'
      }

    },

    /* jsdoc */
    jsdoc : {
      dist : {
        src: ['src/app/**/*.js', 'src/assets/**/*.js', 'websocket-test/RMBTWebsocketTest.js'],
        options: {
          destination: 'doc'
        }
      }
    },

    /**
     * The `index` task compiles the `index.html` file as a Grunt template. CSS
     * and JS files co-exist here but they get split apart later.
     */
    index: {

      /**
       * During development, we don't want to have wait for compilation,
       * concatenation, minification, etc. So to avoid these steps, we simply
       * add all script files directly to the `<head>` of `index.html`. The
       * `src` property contains the list of included files.
       */
      build: {
        dir: '<%= build_dir %>',
        src: [
          '<%= vendor_files.js %>',
          '<%= build_dir %>/src/**/*.js',
          '<%= html2js.app.dest %>',
          '<%= html2js.customer.dest %>',
          '<%= vendor_files.css %>',
          '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css'
        ]
      },

      /**
       * When it is time to have a completely compiled application, we can
       * alter the above to include only a single JavaScript and a single CSS
       * file. Now we're back!
       */
      compile: {
        dir: '<%= compile_dir %>',
        src: [
          '<%= concat.compile_js.dest %>',
          '<%= vendor_files.css %>',
          '<%= build_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.css'
        ]
      }
    },

    /**
     * And for rapid development, we have a watch set up that checks to see if
     * any of the files listed below change, and then to execute the listed
     * tasks when they do. This just saves us from having to type "grunt" into
     * the command-line every time we want to see what we're working on; we can
     * instead just leave "grunt watch" running in a background terminal. Set it
     * and forget it, as Ron Popeil used to tell us.
     *
     * But we don't need the same thing to happen for all the files.
     */
    delta: {
      /**
       * By default, we want the Live Reload to work for all tasks; this is
       * overridden in some tasks (like this file) where browser resources are
       * unaffected. It runs by default on port 35729, which your browser
       * plugin should auto-detect.
       */
      options: {
        livereload: true
      },

      /**
       * When the Gruntfile changes, we just want to lint it. In fact, when
       * your Gruntfile changes, it will automatically be reloaded!
       */
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile'],
        options: {
          livereload: true
        }
      },

      /**
       * When our JavaScript source files change, we want to run lint them and
       * run our unit tests.
       */
      jssrc: {
        files: [
          '<%= app_files.js %>'
        ],
        tasks: ['jshint:src', 'copy:build_appjs']
      },

      websockettest: {
        files: [
          'websocket-test/*.js',
          'lib/**/*.js'
        ],
        tasks: ['copy:build_vendorjs']
      },

      /**
       * When assets are changed, copy them. Note that this will *not* copy new
       * files, so this is probably not very useful.
       */
      assets: {
        files: [
          'src/assets/**/*'
        ],
        tasks: [ 'copy:build_app_assets', 'copy:build_vendor_assets' ]
      },

      qos: {
        files: [
          'src/qos/**/*'
        ],
        tasks: [ 'copy:build_qos_html' ]
      },

      customers: {
        files: [
          'customers/**/*'
        ],
        tasks: [ 'less:build', 'copy:copy_customer_views', 'copy:compile_customer_views',
        // 'copy:build_customerjs',
        'compile:build_customerjs',
        'copy:build_vendorjs', 'asciidoctor:build', 'asciidoctor:build_customers' ]
      },

      /**
       * When index.html changes, we need to compile it.
       */
      html: {
        files: [ '<%= app_files.html %>' ],
        tasks: [ 'index:build' ]
      },

      /**
       * When adoc files change, convert them to html.
       */
      adoc: {
        files: [ 'src/**/*.adoc' ],
        tasks: [ 'asciidoctor:build', 'asciidoctor:build_customers', 'asciidoctor:compile', 'asciidoctor:compile_customers' ]
      },

      /**
       * When our templates change, we only rewrite the template cache.
       */
      tpls: {
        files: [
          '<%= app_files.atpl %>'
        ],
        tasks: [ 'html2js' ]
      },

      /**
       * When the CSS files change, we need to compile and minify them.
       */
      less: {
        files: [ 'src/**/*.less' ],
        tasks: [ 'less:build' ]
      }
    },

    asciidoctor: {
      build: {
        options: {
          cwd: 'src/app/',
          showNumberedHeadings: true,
          showTitle: false,
          showToc: true,
          header_footer: false
        },
        files: {
          '<%= build_dir %>/': ['views/**/*.adoc']
        }
      },
      build_customers: {
        options: {
          showNumberedHeadings: true,
          showTitle: false,
          showToc: true,
          header_footer: false
        },
        files: {
          '<%= build_dir %>/': ['customers/' + CUSTOMER + '/**/*.adoc']
        }
      },
      compile: {
        options: {
          cwd: 'src/app/',
          showNumberedHeadings: true,
          showTitle: false,
          showToc: true,
          header_footer: false
        },
        files: {
          '<%= compile_dir %>/': ['views/**/*.adoc']
        }
      },
      compile_customers: {
        options: {
          showNumberedHeadings: true,
          showTitle: false,
          showToc: true,
          header_footer: false
        },
        files: {
          '<%= compile_dir %>/': ['customers/' + CUSTOMER + '/**/*.adoc']
        }
      }
    },

    sshexec: {
      list: {
        command: 'ls -la /home/nettest',
        options: {
          host: '<%= deploy.host %>',
          privateKey: null,
          username: '<%= deploy.user %>',
          passphrase: '<%= deploy.password %>'
        }
      },
      jar: {
        command: 'cp -r /home/nettest/jar /home/nettest/html',
        options: {
          host: '<%= deploy.host %>',
          privateKey: rsaKey,
          username: '<%= deploy.user %>',
          passphrase: '<%= deploy.password %>'
        }
      },
      badges: {
        command: 'cp -r /home/nettest/badges /home/nettest/html',
        options: {
          host: '<%= deploy.host %>',
          privateKey: rsaKey,
          username: '<%= deploy.user %>',
          passphrase: '<%= deploy.password %>'
        }
      },
      backup: {
        command: 'cp -r <%= deploy.path %> <%= deploy.path %>' + getCurrentTimes,
        options: {
          host: '<%= deploy.host %>',
          privateKey: rsaKey,
          username: '<%= deploy.user %>',
          passphrase: grunt.option('passphrase') + ""
        }
      },
      // Fix task. Outputs a false positive.
      backup_script: {
        command: '/home/nettest/moveDir.sh',
        options: {
          host: '<%= deploy.host %>',
          //privateKey: grunt.file.read("/home/cpogolsha/.ssh/id_rsa"),
          username: '<%= secret.username %>',
          passphrase: '<%= secret.passphrase %>'
        }
      }
    },
    prompt: {
      sshcredentials: {
        options: {
          questions: [
            {
              config: 'deploy.password',
              type: 'password',
              message: 'enter ssh password',
              default: ''
            }
          ]
        }
      }
    },

    rsync: {
      dev: {
        options: {
          args: ['-avz', '--verbose', '--delete'],
          exclude: ['.git*', 'cache', 'logs', 'applet/'],

          src: 'build/',
          dest: '<%= deploy.user %>@<%= deploy.host %>:<%= deploy.path %>',
          ssh: true,
          recursive: true
        }
      },
      prod: {
        options: {
          args: ['-avz', '--verbose', '--delete'],
          exclude: ['.git*', 'cache', 'logs', 'applet/'],

          src: 'bin/',
          dest: '<%= deploy.user %>@<%= deploy.host %>:<%= deploy.path %>',
          ssh: true,
          recursive: true
        }
      }
    },

    connect: {
      dev: {
        options: {
          keepalive: true,
          protocol: 'http',
          //hostname: CUSTOMER,
          hostname: '*', // to let it also bind on the ip address
          base: 'build',
          port: (WEBSERVER_PORT || 9000),
          middleware: rewriteFunction
        }
      },
      prod: {
        options: {
          keepalive: true,
          protocol: 'http',
          //hostname: CUSTOMER,
          hostname: '*', // to let it also bind on the ip address
          base: 'bin',
          port: (WEBSERVER_PORT || 9001),
          middleware: rewriteFunction
        }
      }
    },

    transifex: {
      "nettest": {
        options: {
          targetDir: "./src/assets/lang",
          resources: ["langjson"],
          filename : "lang__lang_.json",
          languages: ["en", "sr", "sr@latin", "sl", "sk"],
        }
      }
    },

    rename: {
      postTransifex: {
        files: [
          {
            src: ['src/assets/lang/lang_sr@latin.json'],
            dest: 'src/assets/lang/lang_sr-Latn.json'
          },
        ]
      }
    },

    obfuscator: {
      task1: {
          files: {
              '<%= compile_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.js': [
                  '<%= compile_dir %>/assets/<%= pkg.name %>-<%= pkg.version %>.js',
              ]
          }
      }
    }
  };

  grunt.initConfig(grunt.util._.extend(taskConfig, userConfig, deployConfig));

  /**
   * In order to make it safe to just compile or copy *only* what was changed,
   * we need to ensure we are starting from a clean, fresh build. So we rename
   * the `watch` task to `delta` (that's why the configuration var above is
   * `delta`) and then add a new task called `watch` that does a clean build
   * before watching for changes.
   */
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['build', 'delta']);

  /**
   * The default task is to build and compile.
   */
  grunt.registerTask('default', ['build', 'compile']);

  grunt.registerTask('fetch-translations', ['transifex:nettest', 'rename:postTransifex']);

  /**
   * The `build` task gets your app ready to run for development and testing.
   */
  grunt.registerTask('build', [
    'clean', 'html2js', /*'jshint',*/ 'less:build', 'asciidoctor:build', 'asciidoctor:build_customers', 'copy:copy_customer_views',
    'concat:build_css', 'copy:build_profilejs', 'copy:build_app_assets', 'copy:customer_images', 'copy:customer_i18n_images', 'copy:customer_src', 'copy:build_vendor_assets',
    'copy:build_appjs',
    // 'copy:build_customerjs',
    'concat:build_customerjs',
    'copy:build_vendorjs', 'copy:build_vendorcss','copy:build_vendor_res',  'index:build', 'copy:build_qos_html',
    'jsdoc', "json_merge", 'babel',
  ]);

  grunt.registerTask('merge', ["concat:q"]);

  /**
   * The `compile` task gets your app ready for deployment by concatenating and
   * minifying your code.
   */
  if (PROFILE=='production'){
    grunt.registerTask('compile', [
      'less:compile', 'copy:build_profilejs', 'copy:compile_assets',
      // 'copy:build_customerjs',
      'concat:build_customerjs',
      /*'ngAnnotate',*/ 'concat:compile_js',  'uglify', 'index:compile', 'asciidoctor:compile',
      'asciidoctor:compile_customers', 'copy:compile_customer_views', 'copy:compile_qos_html', 'copy:bin_vendor_res'
    ]);
  } else {
    grunt.registerTask('compile', [
      'less:compile', 'copy:build_profilejs', 'copy:compile_assets',
      // 'copy:build_customerjs',
      'concat:build_customerjs',
      /*'ngAnnotate',*/ 'concat:compile_js', 'index:compile', 'asciidoctor:compile',
      'asciidoctor:compile_customers', 'copy:compile_customer_views', 'copy:compile_qos_html', 'copy:build_vendor_res'
    ]);
  }

  // register deploy tasks
  grunt.registerTask('deploy_dev', ['build', 'rsync:dev']);

  var deployTasksList = [
    // 'fetch-translations',
    'build',
    'compile',
    'obfuscator',
    // 'prompt:sshcredentials',
    'sshexec:backup',
    'rsync:prod'
  ];
  if (grunt.option('fetch-translations')) {
    deployTasksList.unshift("fetch-translations");
  }
  if (!grunt.option('obfuscator')) {
    deployTasksList = deployTasksList.filter((t) => t !== 'obfuscator');
  }
  grunt.registerTask('deploy', deployTasksList);

  /**
   * A utility function to get all app JavaScript sources.
   */
  function filterForJS(files) {
    return files.filter(function (file) {
      return file.match(/\.js$/);
    });
  }

  /**
   * A utility function to get all app CSS sources.
   */
  function filterForCSS(files) {
    return files.filter(function (file) {
      return file.match(/\.css$/);
    });
  }


  function createLangTaskConfig() {
    if (!userConfig.langs || userConfig.langs.length === 0) {
      return {
        "null": {
          files: null
        }
      }
    }

    var langsConfig = {};

    userConfig.langs.forEach(function (lang) {
      var langConfig = {};
      langConfig.files = {};
      langConfig.files['<%= build_dir %>/assets/lang/lang_' + lang + '.json'] = [
        'src/assets/lang/lang_' + lang + '.json',
        'customers/' + CUSTOMER + '/lang/lang_' + lang + '.json',
      ];
      langsConfig[lang] = langConfig;
    })

    return langsConfig;
  }


  /**
   * The index.html template includes the stylesheet and javascript sources
   * based on dynamic names calculated in this Gruntfile. This task assembles
   * the list into variables for the template to use and then runs the
   * compilation.
   */
  grunt.registerMultiTask('index', 'Process index.html template', function () {
    var dirRE = new RegExp( '^('+grunt.config('build_dir')+'|'+grunt.config('compile_dir')+')\/', 'g' );

    var jsFiles = filterForJS( this.filesSrc ).map( function ( file ) {
      return file.replace( dirRE, '' );
    });
    jsFiles = (userConfig.vendor_files.external_scripts || []).concat(jsFiles);

    console.log(jsFiles);

    var cssFiles = filterForCSS( this.filesSrc ).map( function ( file ) {
      return file.replace( dirRE, '' );
    });

    grunt.file.copy('src/index.html', this.data.dir + '/index.html', {
      process: function (contents) {
        return grunt.template.process( contents, {
          data: {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config('pkg.version'),
            customer: userConfig.UI.CUSTOMER_NAME
          }
        });
      }
    });
  });
};
