define([], function() {

  function checkPropertyIsObject(obj, propertyName)
  {
    if (!obj[propertyName] || typeof obj[propertyName] !== 'object')
    {
      obj[propertyName] = {};
    }
  }

  function fillFeatureLayerProperties(newLayerDef, origLayer)
  {
    fillDefaultLayerProperties(newLayerDef, origLayer);
    newLayerDef.layerType = 'ArcGISFeatureLayer';
    newLayerDef.title = origLayer.name;

    //renderer
    if (typeof (origLayer.renderer) !== 'undefined' && origLayer.renderer != null) {
      //newLayerDef.layerDefinition = {};
      checkPropertyIsObject(newLayerDef, 'layerDefinition');
      checkPropertyIsObject(newLayerDef.layerDefinition, 'drawingInfo');
      newLayerDef.layerDefinition.drawingInfo.renderer = origLayer.renderer.toJson();
    }
    //labeling
    if (typeof (origLayer.labelingInfo) !== 'undefined' && origLayer.labelingInfo != null) {
      checkPropertyIsObject(newLayerDef, 'layerDefinition');
      checkPropertyIsObject(newLayerDef.layerDefinition, 'drawingInfo');
      newLayerDef.layerDefinition.drawingInfo.labelingInfo = origLayer.labelingInfo;
    }
    //defexpresion
    var defExpr = origLayer.getDefinitionExpression();
    if (typeof (defExpr) !== 'undefined' && defExpr != null) {
      checkPropertyIsObject(newLayerDef, 'layerDefinition');
      newLayerDef.layerDefinition.definitionExpression = defExpr;
    }

    //minscale
    if (origLayer.minScale > 0) {
      checkPropertyIsObject(newLayerDef, 'layerDefinition');
      newLayerDef.layerDefinition.minScale = origLayer.minScale;
    }

    //maxscale
    if (origLayer.maxScale > 0) {
      checkPropertyIsObject(newLayerDef, 'layerDefinition');
      newLayerDef.layerDefinition.maxScale = origLayer.maxScale;
    }
    //showLabels
    newLayerDef.showLabels = origLayer.showLabels;
    //popupinfo
    if (typeof (origLayer.infoTemplate) !== 'undefined' && origLayer.infoTemplate != null) {
      newLayerDef.popupInfo = origLayer.infoTemplate.toJson();
    }
  }

  function fillDynamicLayerProperties(newLayerDef, origLayer)
  {
    fillDefaultLayerProperties(newLayerDef, origLayer);
    newLayerDef.layerType = 'ArcGISMapServiceLayer';
    newLayerDef.title = origLayer.name || origLayer.id;
    if (origLayer.layerDrawingOptions && Array.isArray(origLayer.layerDrawingOptions)) {
      var layers = origLayer.layerInfos.map(function(layerInfo, index) {
        var layerDrawingOptions = origLayer.layerDrawingOptions[index];
        var layer = layerInfo.toJson();
        layer.id = index;
        layer.layerDefinition = {
          // TODO: where to source info?
          source: {
            type: 'mapLayer',
            mapLayerId: index
          }
        };
        if (layerDrawingOptions) {
          layer.layerDefinition.drawingInfo = layerDrawingOptions.toJson();
        }
        return layer;
      });
      newLayerDef.layers = layers;
    }
    // console.log(JSON.stringify(newLayerDef));
  }

  function fillDefaultLayerProperties(newLayerDef,origLayer) {
    newLayerDef.id = origLayer.id;
    newLayerDef.layerType = origLayer.declaredClass.replace('esri.layers.', '');
    newLayerDef.url = origLayer.url;
    newLayerDef.visibility = origLayer.visible;
    newLayerDef.opacity = origLayer.opacity;
    // console.log(origLayer.id, newLayerDef.opacity, origLayer.opacity);
  }


  function getGraphicsLayers(mapObject)
  {
    var operationalLayers = [];
    var graphicLayerids = mapObject.graphicsLayerIds;

    for (var i = 0; i < graphicLayerids.length; i++) {
      var graphicLayerid = graphicLayerids[i];
      var oldOplayer = mapObject.getLayer(graphicLayerid);
      // console.debug('graphicLayerid: ' + graphicLayerid);
      if (oldOplayer.type === 'Feature Layer') {
        var newLayerDef = {};
        fillFeatureLayerProperties(newLayerDef, oldOplayer);
        // console.log(JSON.stringify(newLayerDef));
        operationalLayers.push(newLayerDef);
      }
      // TODO: others?
    }
    return operationalLayers;
  }

  function proccessMapLayers(itemData, mapObject) {
    // check for basemap layers
    var basemapLayerIds = mapObject.basemapLayerIds;
    var layerIds;
    if (!basemapLayerIds || basemapLayerIds.length === 0) {
     basemapLayerIds = mapObject.layerIds.slice(0, 1);
     layerIds = mapObject.layerIds.slice(1);
    } else {
      layerIds = mapObject.layerIds;
    }
    itemData.operationalLayers = getGraphicsLayers(mapObject);
    layerIds.forEach(function(layerId) {
      var oldOplayer = mapObject.getLayer(layerId);
      var newLayerDef = {};
      fillDynamicLayerProperties(newLayerDef, oldOplayer);
      itemData.operationalLayers.push(newLayerDef);
    });
    // console.log('operationalLayers', itemData.operationalLayers);
    itemData.baseMap = getBasemapJson(mapObject, basemapLayerIds);
  }

  function getBasemapJson(mapObject, layerIds) {
    var baseMap = {};
    baseMap.baseMapLayers = [];
    layerIds.forEach(function(layerId, index) {
      var oldLayer = mapObject.getLayer(layerId);
      var newLayerDef = {};
      // get title from layer infos of first layer w/ layer infos
      if (!baseMap.title && oldLayer.layerInfos.length > 0) {
        baseMap.title = oldLayer.layerInfos[0].name;
      }
      // populate layer json
      fillDefaultLayerProperties(newLayerDef, oldLayer);
      newLayerDef.layerType = 'ArcGISTiledMapServiceLayer';
      if (oldLayer._isReference) {
        newLayerDef.isReference = oldLayer._isReference;
      }
      baseMap.baseMapLayers.push(newLayerDef);
    });
    return baseMap;
  }

  return {
    // return map extent in geographic coordinates 
    // in online/portal item format
    // example: [[-139.4916, 10.7191],[-52.392, 59.5199]];
    getItemExtent: function(map) {
      // return map.geographicExtent.toJson();
      var geo = map.geographicExtent;
      return [[geo.xmin, geo.ymin],[geo.xmax, geo.ymax]];
    },

    // serialize a map object into web map JSON
    serialize: function(map, itemInfo) {
      var item = itemInfo || {};
      var itemData = {
        // TODO: get this from?
        'version': '2.0'
      };

      // override item info extent w/ the current map extent
      itemInfo.extent = this.getItemExtent(map);

      // populate operational and basemap layers
      proccessMapLayers(itemData, map);

      return {
        item: item,
        itemData: itemData
      };
    }
  };
});