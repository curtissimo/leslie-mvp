var leslie;

leslie = require('../leslie');

module.exports = {
  'has settings from req.app': function(t) {
    var scene, req;

    req = { app: { settings: {
      one: 1,
      'some thing': /i/
    }}};

    scene = leslie._sceneFactory(req);

    Object.keys(req.app.settings).forEach(function (key) {
      t.ok(scene[key]);
      t.strictEqual(scene[key], req.app.settings[key]);
    });
    t.done();
  }
};
