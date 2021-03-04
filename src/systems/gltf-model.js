var registerSystem = require('../core/system').registerSystem;
var THREE = require('../lib/three');

/**
 * glTF model system.
 *
 * Configures glTF loading options. Models using glTF compression require that a Draco decoder be
 * provided externally.
 *
 * @param {string} dracoDecoderPath - Base path from which to load Draco decoder library.
 */
module.exports.System = registerSystem('gltf-model', {
  schema: {
    dracoDecoderPath: {default: ''},
    basisTranscoderPath: {default: ''}
  },

  init: function () {
    this.dracoLoader = null;
    this.ktx2Loader = null;
    this.update();
  },

  update: function () {
    var path;
    if (!this.dracoLoader) {
      path = this.data.dracoDecoderPath;
      this.dracoLoader = new THREE.DRACOLoader();
      this.dracoLoader.setDecoderPath(path);
    }
    if (!this.ktx2Loader) {

     path=this.data.basisTranscoderPath;
     var gl = this.el.sceneEl.renderer;
     this.ktx2Loader = new THREE.KTX2Loader();
     this.ktx2Loader.detectSupport(gl);
     this.ktx2Loader.setTranscoderPath(path);
    }
  },

  getDRACOLoader: function () {
    return this.dracoLoader;
  },

  getKTX2Loader: function () {
    return this.ktx2Loader;

  }

});
