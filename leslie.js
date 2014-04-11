/*jslint node: true*/
var cwd, fs, leslie, proto, path, rsvp, scene, stat, util, url;

fs = require('fs');
path = require('path');
rsvp = require('rsvp');
util = require('util');
url = require('url');

cwd = process.cwd();
stat = rsvp.denodeify(fs.stat);

function codeError(code, error) {
  'use strict';
  if (typeof error === 'string') {
    error = new Error(error);
  } else {
    error = error || new Error();
  }
  error.statusCode = code;
  return error;
}

function sceneFactory(req, helpers) {
  'use strict';
  var o = {};

  Object.keys(req.app.settings).forEach(function (key) {
    o[key] = req.app.settings[key];
  });
  o.helpers = helpers || [];
  o.url = url.parse(req.url);

  return o;
}

function scenePromise(scene, method) {
  'use strict';
  return new rsvp.Promise(function (res, rej) {
    scene.stage = function (data, controllers) {
      res({ data: data, controllers: controllers });
    };
    scene.cut = function (o) {
      rej(o);
    };
    method(scene);
  });
}

function parseDirective(directive, format) {
  'use strict';
  var args, name, verb, formattedFile, formattedPath, count;

  count = format.match(/%s/g).length;
  name = directive.split('#');
  verb = (name[1] || 'get').toLowerCase();
  name = name[0];
  args = [ format, name ];
  if (count > 1) {
    args.push(verb);
  }
  formattedPath = util.format.apply(null, args);
  formattedFile = formattedPath + '.js';

  return {
    name: name,
    formattedFile: formattedFile,
    formattedPath: formattedPath,
    verb: verb
  };
}

function viewPromise(directive, data, scene) {
  'use strict';
  return new rsvp.Promise(function (res, rej) {
    var code, format, parts;

    format = path.join(cwd, 'lib', '%s', 'views', '%s');
    parts = parseDirective(directive, format);

    code = 404;
    stat(parts.formattedFile)
      .then(function () {
        code = 500;
        return require(parts.formattedPath);
      })
      .then(function (catalog) {
        var viewKey = path.relative(cwd, parts.formattedPath);
        code = 404;
        if (catalog[viewKey] === undefined) {
          throw new Error('view not in the view catalog');
        }
        return catalog[viewKey];
      })
      .then(function (view) {
        code = 500;
        return view(data, {
          helpers: scene.helpers
        });
      })
      .then(function (html) {
        res(html);
      })
      .catch(function (e) {
        rej(codeError(code, e));
      });
  });
}

function controllerPromise(directive, scenes) {
  'use strict';
  var code, format, parts, scene;

  format = path.join(cwd, 'lib', '%s', 'controller');
  parts = parseDirective(directive, format);
  scene = scenes();
  code = 404;

  return new rsvp.Promise(function (res, rej) {
    stat(parts.formattedFile)
      .then(function () {
        code = 500;
        return require(parts.formattedPath);
      })
      .then(function (controller) {
        code = 404;
        if (controller[parts.verb] === undefined) {
          throw new Error('controller does not have verb');
        }
        return controller[parts.verb];
      })
      .then(function (method) {
        code = 500;
        return scenePromise(scene, method);
      })
      .then(function (staging) {
        var data, controllers;

        data = staging.data;
        controllers = staging.controllers || {};

        Object.keys(controllers).forEach(function (key) {
          var value = controllers[key];

          if (typeof value === 'string') {
            data[key] = controllerPromise(value, scenes);
          }
        });

        return rsvp.hash(data);
      })
      .then(function (data) {
        res(viewPromise(directive, data, scene));
      })
      .catch(function (e) {
        rej(codeError(code, e));
      });
  });
}

/*jslint nomen: true*/
proto = {
  addMinion: function (name, helper) {
    'use strict';
    this.minions = this.minions || {};
    this.minions[name] = helper;
  },

  bother: function (directive) {
    'use strict';
    var self = this;

    return function (req, res, next) {
      // Create a scene factory based on the request and helpers
      var scenes, minions;

      minions = self.minions || {};
      scenes = sceneFactory.bind(null, req, minions);

      // Get a promise that invokes the controller
      // Then send the content back if everything is ok
      // Otherwise, send the error down the pipeline
      controllerPromise(directive, scenes)
        .then(function (value) {
          res.send(200, value);
        })
        .catch(function (err) {
          next(err);
        });
    };
  },

  minions: {},

  _codeError: codeError,
  _controllerPromise: controllerPromise,
  _parseDirective: parseDirective,
  _sceneFactory: sceneFactory,
  _scenePromise: scenePromise,
  _viewPromise: viewPromise
};
/*jslint nomen: false*/

leslie = module.exports = Object.create(proto);
