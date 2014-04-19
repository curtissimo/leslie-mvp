var leslie;

leslie = require('../leslie');

module.exports = {
  'has settings from req.app': function(t) {
    var scene, req, res;

    req = {
      app: {
        settings: {
          one: 1,
          'some thing': /i/
        }
      },
      url: '/i/love?tests=true',
      param: function () {}
    };

    res = {
      cookie: function () {},
      clearCookie: function () {}
    }

    scene = leslie._sceneFactory(req, res);

    Object.keys(req.app.settings).forEach(function (key) {
      t.ok(scene[key]);
      t.strictEqual(scene[key], req.app.settings[key]);
    });
    t.done();
  }
};
