module.exports = function(grunt) {
  'use strict';

  var jsSourceFiles = 'src/**/*.js';

  grunt.initConfig({
    jshint: {
      dev: {
        src: jsSourceFiles,
        options: {
          jshintrc: '.jshintrc'/*,
          reporter: require('jshint-stylish')*/
        }
      }
    },

    karma: {
      options: {
        autoWatch: false,
        configFile: './karma.conf.js',
        singleRun: true,
        // there's always some live reload listening on 9876
        // so we're defaulting to 6789
        port: 6789
      },
      unit: {
        options: {
          browsers: [
            'Chrome',
            'Firefox'
          ]
        }
      },
      windows: {
        options: {
          browsers: [
            'Chrome',
            'Firefox',
            'IE'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('test', ['jshint', 'karma']);
  grunt.registerTask('default', ['test']);
};
