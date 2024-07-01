import './style.css';
import {Map, View} from 'ol';

import MVT from 'ol/format/MVT.js';
import VectorTile from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import WebGLVectorTileLayerRenderer from 'ol/renderer/webgl/VectorTileLayer.js';
import {asArray} from 'ol/color.js';
import OSM from 'ol/source/OSM';
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from 'ol/proj';
import {packColor, parseLiteralStyle} from 'ol/webgl/styleparser.js';


const result = parseLiteralStyle({
  'fill-color': ['get', 'fillColor'],
  'stroke-color': ['get', 'strokeColor'],
  'stroke-width': ['get', 'strokeWidth'],
  'circle-radius': ['get', 'circleRadius'],
  'circle-fill-color': 'rgba(255, 50, 28, 0.6)',
});

function scaleLengthToRadius(length) {
  const minRadius = 1;
  const maxRadius = 20;
  const scaleFactor = Math.log10(length + 1);
  return minRadius + (scaleFactor / Math.log10(42000 + 1)) * (maxRadius - minRadius);
}
class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      style: {
        builder: result.builder,
        attributes: {
          fillColor: {
            size: 2,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              const color = asArray(style?.getFill()?.getColor() || 'rgba(255, 50, 28, 0.6)');
              return packColor(color);
            },
          },
          strokeColor: {
            size: 2,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              const color = asArray(style?.getStroke()?.getColor() || 'rgba(255, 50, 28, 0.6)');
              return packColor(color);
            },
          },
          strokeWidth: {
            size: 1,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              return style?.getStroke()?.getWidth() || 0;
            },
          },
          circleRadius: {
            size: 1,
            callback: (feature) => {
              const length = feature.get('Length') || 1;
              return scaleLengthToRadius(length);
            },
          },
        },
      },
    });
  }
}
const cavesLayer = new WebGLVectorTileLayer({
  source: new VectorTileSource({
    attributions:
      '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
      '© <a href="https://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>',
    format: new MVT(),
    url: 'https://vectortileservices9.arcgis.com/NQZO5LWNn98dnQEv/arcgis/rest/services/2023_september_export_ekataster_csv/VectorTileServer/tile/{z}/{y}/{x}.pbf',
  }),
})
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    cavesLayer,
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([14.512, 46.058]),
    zoom: 8,
  }),
});

let selected = null;
map.on('pointermove', function (ev) {
  if (selected !== null) {
    selected.set('hover', 0);
    selected = null;
  }

  map.forEachFeatureAtPixel(ev.pixel, function (feature) {
    feature.set('hover', 1);
    selected = feature;
    return true;
  });
});