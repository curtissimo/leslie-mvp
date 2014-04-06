var leslie;

leslie = require('../leslie');

module.exports = {
  'scene#stage resolves promise with arguments': function (t) {
    var controllers, data, method, promise, scene;

    controllers = {};
    data = {};
    method = function (s) {
      s.stage(data, controllers);
    };
    scene = {};
    
    leslie._scenePromise(scene, method)
      .then(function (value) {
        t.ok(value);
        t.strictEqual(value.data, data);
        t.strictEqual(value.controllers, controllers);
        t.done();
      })
      .catch(function () {
        t.ok(false, 'scene promise not resolved with stage method');
        t.done();
      });
  },

  'scene#cut rejects promise with arguments': function (t) {
    var error, method, promise, scene;

    error = {};
    method = function (s) {
      s.cut(error);
    };
    scene = {};
    
    leslie._scenePromise(scene, method)
      .then(function () {
        t.ok(false, 'scene promise not resolved with stage method');
        t.done();
      })
      .catch(function (e) {
        t.ok(e);
        t.strictEqual(e, error);
        t.done();
      });
  }
};
