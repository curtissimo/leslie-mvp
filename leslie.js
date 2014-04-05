/*jslint node: true*/
var leslie, proto, path, scene, rsvp;

path = require('path');
rsvp = require('rsvp');

function scene() {
  'use strict';
  var promise, methods;
  methods = {};
  promise = new rsvp.Promise(function (resolve, reject) {
    methods.resolve = resolve;
    methods.reject = reject;
  });
  return Object.create(promise, {
    done: { value: function (o) { methods.resolve(o); }}
  });
}

proto = {
  bother: function (controllerName) {
    'use strict';
    var name, method;

    name = controllerName.split('#');
    if (name.length === 1) {
      name = name[0];
    } else {
      method = name[1];
      name = name[0];
    }

    if (name.substring(0, 1) === ':') {
      name = function (req) {
        return req.param('controller');
      };
    } else {
      name = (function (name) {
        return function (req) {
          req.params.controller = name;
          return name;
        };
      }(name));
    }

    return function (req, res, next) {
      var cwd, basePath, controllerPath, viewPath, controller, invocation, view;

      if (method === undefined) {
        method = req.method;
      }
      method = method.toLowerCase();

      cwd = process.cwd();
      basePath = path.join(cwd, 'lib', name(req));
      controllerPath = path.join(basePath, 'controller.js');
      viewPath = path.join(basePath, 'views', method);

      try {
        controller = require(controllerPath);
      } catch (e) {
        return next();
      }

      invocation = scene(req, res);
      controller[method](invocation);
      invocation.then(function (o) {
        view = require(viewPath);
        return o;
      }).then(function (o) {
        res.send(200, view[path.relative(cwd, viewPath)](o, {
          helpers: {
            pathTo: req.app.pathTo
          }
        }));
      }).catch(function (e) {
        var message;
        if (e.code === 'MODULE_NOT_FOUND') {
          message = 'Could not find "' + path.relative(cwd, viewPath) + '"';
          return res.send(404, message);
        }
        res.send(500, e);
      });
    };
  }
};

leslie = module.exports = Object.create(proto);
