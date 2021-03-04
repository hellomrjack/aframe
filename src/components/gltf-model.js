var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');
var utils = require('../utils/');

var warn = function(msg) {
    utils.debug('components:gltf-model:warn')(msg);
};
var LOADING_MODELS = {};
var MODELS = {};

/**
 * glTF model loader.
 */
module.exports.Component = registerComponent('gltf-model', {
  schema: {
      type: 'model',
      part: { default: '' }
  },

  init: function () {
    this.model = null;
  },

  getLoader: function () {
    var dracoLoader = this.system.getDRACOLoader();
    var ktx2Loader = this.system.getKTX2Loader();
    var loader = new THREE.GLTFLoader();
    if (dracoLoader) {
      loader.setDRACOLoader(dracoLoader);
    }
    if(ktx2Loader) {
        loader.setKTX2Loader(ktx2Loader);
    }
    return loader;
  },

  update: function () {
    var el = this.el;

    this.getModel(function (modelPart) {
      if (!modelPart) { return; }
      // modelPart.matrix.copy(modelPart.matrixWorld);
      // modelPart.applyMatrix4(el.object3D.matrixWorld.clone().invert());
      el.setObject3D('mesh', modelPart)
    });
  },

    getModel: function(cb) {
     var self = this;
     var src = this.data;
    var el = this.el;

    // Already parsed, grab it.
    if (MODELS[src]) {
      cb(this.selectFromModel(MODELS[src]));
      return;
    }

    // Currently loading, wait for it.
    if (LOADING_MODELS[src]) {
      return LOADING_MODELS[src].then(function (model) {
        cb(self.selectFromModel(model));
      });
    }

    // Not yet fetching, fetch it.
    LOADING_MODELS[src] = new Promise(function (resolve) {
        var loader = self.getLoader();
        loader.load(src, function (gltfModel) {
        MODELS[src] = gltfModel;
        delete LOADING_MODELS[src];
        cb(self.selectFromModel(gltfModel));
        resolve(gltfModel);
      },  undefined /* onProgress */, function gltfFailed (error) {
          var message = (error && error.message) ? error.message : 'Failed to load glTF model';
          warn(message);
          el.emit('model-error', {format: 'gltf', src: src});
        });
    });
  },

  selectFromModel: function (model) {
    var el = this.el;
    var src = this.data;
    var part = el.getAttribute('part');
    var root = undefined;
    let scene = model.scene || model.scenes[0];
    if (part && part.length > 0) {
      const specs = part.split(' ').reduce((acc,curr)=>
          [acc[curr.split(':')[0]]=curr.split(':').slice(1).join(':'), acc],
      {})[1];
      const threeType = THREE[specs.type] || null;
      const nodeName = new RegExp(specs.name) || null;
      scene.traverse(function (element) {
          let success = true;
          if (threeType){
            success = (element instanceof threeType)
          }
          if (nodeName){
            success = nodeName.test(element.name)
          }
          if (success) {
              root = element;
              return !success;
          }
      });
      if (!root) {
          var message = 'Failed to find glTF subscene: '+part+' in: '+src;
          warn(message);
          el.emit('model-error', {format: 'gltf', src: src});
          return;
      }
    }
    else {
      root = scene
    }
    root.animations = model.animations;
    return root
  },
  remove: function () {
    if (!this.model) { return; }
    this.el.removeObject3D('mesh');
  }
});
