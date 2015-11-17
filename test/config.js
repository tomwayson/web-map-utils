(function(window) {
  'use strict';

  var allTestFiles = [];
  var TEST_REGEXP = /test\/spec.*\.js$/;

  for (var file in window.__karma__.files) {
    if (TEST_REGEXP.test(file)) {
      allTestFiles.push(file);
    }
  }

  window.dojoConfig = {
    packages: [
      {
        name: 'app',
        location: '/base/src'
      },
      {
        name: 'test',
        location: '/base/test'
      },
      {
        name: '_',
        location: 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3',
        main: 'underscore-min'
      },
      // esri/dojo packages
      {
        name: 'dgrid',
        location: 'http://js.arcgis.com/3.14/dgrid'
      }, {
        name: 'dijit',
        location: 'http://js.arcgis.com/3.14/dijit'
      }, {
        name: 'esri',
        location: 'http://js.arcgis.com/3.14/esri'
      }, {
        name: 'dojo',
        location: 'http://js.arcgis.com/3.14/dojo'
      }, {
        name: 'dojox',
        location: 'http://js.arcgis.com/3.14/dojox'
      }, {
        name: 'put-selector',
        location: 'http://js.arcgis.com/3.14/put-selector'
      }, {
        name: 'util',
        location: 'http://js.arcgis.com/3.14/util'
      }, {
        name: 'xstyle',
        location: 'http://js.arcgis.com/3.14/xstyle'
      }
    ],
    async: true
  };


  /**
   * This function must be defined and is called back by the dojo adapter
   * @returns {string} a list of dojo spec/test modules to register with your testing framework
   */
  window.__karma__.dojoStart = function() {
    return allTestFiles;
  };
})(window);
