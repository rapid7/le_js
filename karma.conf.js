// Karma configuration
// Generated on Fri Apr 04 2014 16:41:37 GMT+0100 (IST)
/*jslint node:true*/

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      // Source files
      'src/*.js',
      // Specs
      'test/*Spec.js'
    ],


    // list of files to exclude
    exclude: [

    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {

    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
// available browsers: https://saucelabs.com/platforms
  var customLaunchers = {
    sl_safari: {
        base: 'SauceLabs',
        browserName: 'safari',
        platform:'OS X 10.9'
    },
    sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox'
    },
    sl_ie_9: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '9'
    },
    sl_ie_11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '11'
    }
  };

  if (process.env.CI) {
    config.set({
        sauceLabs: {
            username: process.env.SAUCELABS_USERNAME,
            accessKey: process.env.SAUCELABS_ACCESSKEY,
            testName: process.env.TRAVIS_JOB_NUMBER
        },
        recordScreenshots: false,
        customLaunchers: customLaunchers,
        browsers: ['sl_firefox', 'sl_ie_9', 'sl_ie_11', 'sl_safari', 'PhantomJS'],
        reporters: ['saucelabs'],
        colors: false,
        singleRun: true
    });
  }
};
