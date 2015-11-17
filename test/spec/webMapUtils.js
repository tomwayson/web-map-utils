define([
  'app/webMapUtils',

  'dojo/text!test/data/dynamic-layer-no-symbol.json',
  'dojo/text!test/data/watershed-feature-layer-added.json',
  'dojo/text!test/data/watershed-webmap.json',

  'esri/arcgis/utils',
  'esri/layers/FeatureLayer',
  'esri/renderers/SimpleRenderer',
  'esri/layers/LayerDrawingOptions',
],
function(
  webMapUtils,

  dynamicLayerNoSymbolText,
  watershedFeatureLayerAddedText,
  watershedWebmapText,

  arcgisUtils,
  FeatureLayer,
  SimpleRenderer,
  LayerDrawingOptions
) {
  'use strict';

  function compareExtent(util, actual, expected) {
    if (!util.equals(Math.round(actual.spatialReference, 0), Math.round(expected.spatialReference, 0))) {
      return { pass: false };
    }
    if (!util.equals(Math.round(actual.xmin, 0), Math.round(expected.xmin, 0))) {
      return { pass: false };
    }
    if (!util.equals(Math.round(actual.ymin, 0), Math.round(expected.ymin, 0))) {
      return { pass: false };
    }
    if (!util.equals(Math.round(actual.xmax, 0), Math.round(expected.xmax, 0))) {
      return { pass: false };
    }
    if (!util.equals(Math.round(actual.ymax, 0), Math.round(expected.ymax, 0))) {
      return { pass: false };
    }
    return { pass: true };
  }

  function compareLayerBase(util, actual, expected) {
    var result = {
      message: 'layer did not match'
    };
    result.pass = util.equals(actual.id, expected.id);
    if (!result.pass) {
      result.message = 'layer id did not match';
      return result;
    }
    result.pass = util.equals(actual.url, expected.url);
    if (!result.pass) {
      result.message = 'layer url did not match';
      return result;
    }
    result.pass = util.equals(actual.opacity, expected.opacity);
    if (!result.pass) {
      result.message = 'layer opacity ' + actual.opacity + ' did not match ' + expected.opacity;
      return result;
    }
    result.pass = true;
    return result;
  }

  function compareLayer(util, actual, expected) {
    var result = compareLayerBase(util, actual, expected);
    if (!result.pass) {
      return result;
    }
    result.pass = util.equals(actual.visible, expected.visible);
    if (!result.pass) {
      result.message = 'layer visible did not match';
      return result;
    }
    result.pass = util.equals(actual.declaredClass, expected.declaredClass);
    if (!result.pass) {
      result.message = 'layer declaredClass did not match';
      return result;
    }
    if (expected.layerDrawingOptions && expected.layerDrawingOptions.some) {
      result.pass = actual.layerDrawingOptions && util.equals(actual.layerDrawingOptions.length, expected.layerDrawingOptions.length);
      if (!result.pass) {
        result.message = 'layerDrawingOptions length did not match';
        return result;
      }
      expected.layerDrawingOptions.some(function(layerDrawingOptions, index) {
        var actualLayerDrawingOptions = actual.layerDrawingOptions[index];
        result.pass = util.equals(actualLayerDrawingOptions.toJson(), layerDrawingOptions.toJson());
        return result.pass;
      });
      if (!result.pass) {
        result.message = 'layerDrawingOptions did not match';
        return result;
      }
    }
    result.pass = true;
    return result;
  }

  function compareOperationalLayer(util, actual, expected) {
    var result = compareLayerBase(util, actual, expected);
    if (!result.pass) {
      return result;
    }
    result.pass = util.equals(actual.layerType, expected.layerType);
    if (!result.pass) {
      result.message = 'layer type "' + actual.layerType + '"" did not match "' + expected.layerType + '"';
      return result;
    }
    result.pass = util.equals(actual.visibility, expected.visibility);
    if (!result.pass) {
      result.message = 'layer visibility did not match';
      return result;
    }
    result.pass = util.equals(actual.title, expected.title);
    if (!result.pass) {
      result.pass = util.equals(actual.title, expected.id);
    }
    if (!result.pass) {
      result.message = 'layer title "' + actual.tile + '"" did not match "' + expected.title + '"';
      return result;
    }
    // if (expected.minScale) {
      result.pass = util.equals(actual.minScale, expected.minScale);
      if (!result.pass) {
        result.message = 'layer min scale did not match ' + expected.minScale;
        return result;
      }
    // }
    // if (expected.maxScale) {
      result.pass = util.equals(actual.maxScale, expected.maxScale);
      if (!result.pass) {
        result.message = 'layer max scale did not match ' + expected.maxScale;
        return result;
      }
    // }
    if (expected.layerType !== 'ArcGISFeatureLayer') {
      result.pass = true;
      return result;
    }
    result.pass = util.equals(actual.showLabels, expected.showLabels);
    if (!result.pass) {
      result.message = 'layer showLabels "' + actual.showLabels + '"" did not match "' + expected.showLabels + '"';
      return result;
    }
    result.pass = true;
    return result;
  }

  function compareOperationalLayers(util, actual, expected) {
    var result = {
      message: 'operational layers did not match'
    };
    result.pass = util.equals(actual.length, expected.length);
    actual.some(function(actualLayer, i) {
      var expectedLayer = expected[i]; // TODO: by id?
      result = compareOperationalLayer(util, actualLayer, expectedLayer);
      return result.pass;
    });
    return result;
  }

  function compareBaseMap(util, actual, expected) {
    var result = {
      message: 'basemaps did not match'
    };
    result.pass = util.equals(actual.baseMapLayers.length, expected.baseMapLayers.length);
    actual.baseMapLayers.some(function(actualLayer, i) {
      var expectedLayer = expected.baseMapLayers[i]; // TODO: by id?
      result = compareLayerBase(util, actualLayer, expectedLayer);
      return result.pass;
    });
    return result;
  }

  var customMatchers = {
    toEqualExtent: function(util/*, customEqualityTesters*/) {
       return {
        compare: function(actual, expected) {
          return compareExtent(util, actual, expected);
        }
      };
    },
    toEqualLayer: function(util/*, customEqualityTesters*/) {
       return {
        compare: function(actual, expected) {
          return compareLayer(util, actual, expected);
        }
      };
    },
    toEqualOperationalLayers: function(util/*, customEqualityTesters*/) {
       return {
        compare: function(actual, expected) {
          return compareOperationalLayers(util, actual, expected);
        }
      };
    },
    toEqualBaseMap: function(util/*, customEqualityTesters*/) {
       return {
        compare: function(actual, expected) {
          return compareBaseMap(util, actual, expected);
        }
      };
    }
  };

  // this is a simple sanity check to verify
  // that the test framwork is up and running
  describe('sanity check', function() {
    it('should be defined', function() {
      expect(webMapUtils).toBeDefined();
    });
  });

  describe('serialize', function() {
    var mapDiv, mapObj, mapDiv2, mapObj2;

    beforeAll(function() {
      jasmine.addMatchers(customMatchers);
      mapDiv = document.createElement('div');
      mapDiv.setAttribute('id', 'map');
      mapDiv.setAttribute('style', 'width: 400px; height: 400px');
      document.body.appendChild(mapDiv);
      console.log('map div created');
      mapDiv2 = document.createElement('div');
      mapDiv2.setAttribute('id', 'map2');
      mapDiv2.setAttribute('style', 'width: 400px; height: 400px');
      document.body.appendChild(mapDiv2);
      console.log('map div2 created');
    });

    afterAll(function() {
      if (document.getElementById('map')) {
        document.body.removeChild(mapDiv);
      }
      mapDiv = null;
      console.log('map div destroyed');
      if (document.getElementById('map2')) {
        document.body.removeChild(mapDiv2);
      }
      mapDiv2 = null;
      console.log('map div2 destroyed');
    });

    describe('when changing dynamic map layer symbol', function() {
      var outWebMapJson, actualLayer, expectedLayer;

      beforeAll(function(done) {
        var layerId = 'ServiceAreas_6576';
        var inWebMapJson = JSON.parse(dynamicLayerNoSymbolText);
        arcgisUtils.createMap(inWebMapJson, 'map').then(function(response) {
          var optionsArray = [];
          var drawingOptions = new LayerDrawingOptions();
          mapObj = response.map;
          expectedLayer = mapObj.getLayer(layerId);
          // change layer outline symbol
          drawingOptions.renderer = new SimpleRenderer({
            type: 'simple',
            label: '',
            description: '',
            symbol: {
              type: 'esriSFS',
              style: 'esriSFSNull',
              // color: [115,76,0,255],
              outline: {
                type: 'esriSLS',
                style: 'esriSLSSolid',
                color: [110,110,110,255],
                width: 1
              }
            }
          }); 
          // set the drawing options for the relevant layer
          // optionsArray index corresponds to layer index in the map service
          optionsArray[0] = drawingOptions;
          expectedLayer.setLayerDrawingOptions(optionsArray);
          outWebMapJson = webMapUtils.serialize(mapObj, inWebMapJson.item);
          arcgisUtils.createMap(outWebMapJson, 'map2').then(function(response2) {
            console.log('map obj2 created');
            mapObj2 = response2.map;
            actualLayer = mapObj2.getLayer(layerId);
            done();
          }, function(err) {
            expect(err).toBeUndefined();
            done();
          });
          console.log('map obj created');
        }, function(err) {
          expect(err).toBeUndefined();
          done();
        });
      });

      afterAll(function() {
        if (mapObj && mapObj.destroy) {
          mapObj.destroy();
          console.log('map obj destroyed');
        }
        if (mapObj2 && mapObj2.destroy) {
          mapObj2.destroy();
          console.log('map obj2 destroyed');
        }
      });

      it('should have the same extent', function() {
        expect(mapObj2.extent.toJson()).toEqualExtent(mapObj.extent.toJson());
      });

      it('should have the same layerIds', function() {
        expect(mapObj2.layerIds).toEqual(mapObj.layerIds);
      });

      it('should have the same layer props', function() {
        expect(actualLayer).toEqualLayer(expectedLayer);
      });

      it('should have the same basemap', function() {
        var actualBasemapLayer = mapObj2.getLayer(mapObj2.layerIds[0]);
        var expectedBasemapLayer = mapObj.getLayer(mapObj.layerIds[0]);
        expect(actualBasemapLayer).toEqualLayer(expectedBasemapLayer);
      });
    });

    describe('when changing watershed layer properties', function() {
      var outWebMapJson, actualLayer, expectedLayer;

      beforeAll(function(done) {
        var layerId = 'wbd';
        var inWebMapJson = JSON.parse(watershedWebmapText);
        arcgisUtils.createMap(inWebMapJson, 'map').then(function(response) {
          mapObj = response.map;
          // change layer properties
          expectedLayer = mapObj.getLayer(layerId);
          expectedLayer.setOpacity(0.5);
          expectedLayer.hide();
          outWebMapJson = webMapUtils.serialize(mapObj, inWebMapJson.item);
          arcgisUtils.createMap(outWebMapJson, 'map2').then(function(response2) {
            console.log('map obj2 created');
            mapObj2 = response2.map;
            actualLayer = mapObj2.getLayer(layerId);
            done();
          }, function(err) {
            expect(err).toBeUndefined();
            done();
          });
          console.log('map obj created');
        }, function(err) {
          expect(err).toBeUndefined();
          done();
        });
      });

      afterAll(function() {
        if (mapObj && mapObj.destroy) {
          mapObj.destroy();
          console.log('map obj destroyed');
        }
        if (mapObj2 && mapObj2.destroy) {
          mapObj2.destroy();
          console.log('map obj2 destroyed');
        }
      });

      it('should have the same extent', function() {
        expect(mapObj2.extent.toJson()).toEqualExtent(mapObj.extent.toJson());
      });

      it('should have the same layerIds', function() {
        expect(mapObj2.layerIds).toEqual(mapObj.layerIds);
      });

      it('should have the same layer props', function() {
        expect(actualLayer).toEqualLayer(expectedLayer);
      });

      it('should have the same basemap', function() {
        var actualBasemapLayer = mapObj2.getLayer(mapObj2.layerIds[0]);
        var expectedBasemapLayer = mapObj.getLayer(mapObj.layerIds[0]);
        expect(actualBasemapLayer).toEqualLayer(expectedBasemapLayer);
      });
    });

    // TODO: compare map objs, not web map JSON
    describe('when adding a feature layer to the watershed map', function() {
      var inWebMapJson, outWebMapJson, expectedWebMapJson;

      beforeAll(function(done) {
        inWebMapJson = JSON.parse(watershedWebmapText);
        expectedWebMapJson = JSON.parse(watershedFeatureLayerAddedText);
        arcgisUtils.createMap(inWebMapJson, 'map').then(function(response) {
          mapObj = response.map;
          console.log('map obj created');
          // add feature service
          var featureLayer = new FeatureLayer('http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2',{
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ['*']
          });
          var handle = featureLayer.on('update-end', function() {
            handle.remove();
            outWebMapJson = webMapUtils.serialize(mapObj, inWebMapJson.item);
            done();
          });
          mapObj.addLayer(featureLayer);
        }, function(err) {
          expect(err).toBeUndefined();
          done();
        });
      });

      afterAll(function() {
        if (mapObj && mapObj.destroy) {
          mapObj.destroy();
          console.log('map obj destroyed');
        }
      });

      it('should have the same item info', function() {
        expectedWebMapJson.item.extent = webMapUtils.getItemExtent(mapObj);
        expect(outWebMapJson.item).toEqual(expectedWebMapJson.item);
      });

      it('should have the same basemap', function() {
        expect(outWebMapJson.itemData.baseMap).toEqualBaseMap(expectedWebMapJson.itemData.baseMap);
      });

      it('should have the same operational layers', function() {
        expect(outWebMapJson.itemData.operationalLayers).toEqualOperationalLayers(expectedWebMapJson.itemData.operationalLayers);
      });
    });

  });
});
