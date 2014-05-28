// Copyright 2014 by curtissimo, llc
//
// Licensed under the MIT license, a copy of which you can find in the
// distribution in the LICENSE file.

/*jslint node: true*/

// Declare and initialize module-level variables.
var cwd, fs, leslie, proto, path, rsvp, scene, stat, util, url, modifyScene;

fs = require('fs');
path = require('path');
rsvp = require('rsvp');
util = require('utile');
url = require('url');

cwd = process.cwd();
stat = rsvp.denodeify(fs.stat);
modifyScene = function (o) { 'use strict'; return o; };

// Define an utility funciton that takes a code and an error to normalize for
// use in the HTTP-handling stack.
function codeError(code, error) {
  'use strict';
  if (typeof error === 'string') {
    error = new Error(error);
  } else {
    error = error || new Error();
  }
  if (error.statusCode === undefined) {
    error.statusCode = code;
  }
  return error;
}

// Define a utility function that takes a *directive* in the form
// "presenter#verb" and a *format* that provides translation from directive to
// some other format.
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

// # Scenes
// Scenes represent the common interface in **leslie** to the request and
// response of the lifecycle of user interaction over HTTP. We shamelessly stole
// the idea from [Mojito's](https://developer.yahoo.com/cocktails/mojito/) idea
// of the [`ActionContext`](https://developer.yahoo.com/cocktails/mojito/api/classes/ActionContext.html).
// **leslie**'s scene (we hope) provides an easier-to-use interface.

// ## Creating scenes
// First up, declare a scene factory to generate scenes for each HTTP request
// based on the request, response, and global helpers registered with
// **leslie**.
function sceneFactory(req, res, helpers) {
  'use strict';
  var viewData, o;
  o = {};
  viewData = {};

  // Each scene has access to the application's settings.
  Object.keys(req.app.settings).forEach(function (key) {
    o[key] = req.app.settings[key];
  });

  // Each scene has access to the list of globally-defined helpers.
  o.helpers = helpers || [];

  // Each scene has access to the request's URL.
  o.url = url.parse(req.url);

  // Each scene can provide parameter lookup from the request.
  o.param = req.param.bind(req);

  // Each scene can provide access to the cookies sent on the response.
  o.cookie = res.cookie.bind(res);
  o.clearCookie = res.clearCookie.bind(res);

  // Each scene allows for per-request registration of view data from which each
  // presenter can benefit.
  o.addViewData = function (data) {
    util.mixin(viewData, data);
  };
  o.mergeViewData = function (data) {
    var key;
    for (key in viewData) {
      if (viewData.hasOwnProperty(key) && data[key] === undefined) {
        data[key] = viewData[key];
      }
    }
  };

  // For each scene construction, pass it to a registered callback (if it
  // exists) for application-specific modifications.
  if (typeof modifyScene === 'function') {
    o = modifyScene(o, req) || o;
  }

  return o;
}

// ## Interacting with scenes

// **leslie** wraps a scene in a promise so that presenters can interact with
// the scene using semantically rich methods as opposed to configuration blocks.
function scenePromise(scene, method) {
  'use strict';
  return new rsvp.Promise(function (res, rej) {
    // `scene.stage` provides the presenter a method to arrange a view, some
    // data, and call other controllers to assemble a response.
    //
    // * The `view` parameter allows the presenter to use a view named something
    //   other than the name of the HTTP method used to resolve the call.
    // * The `data` parameter contains an object with key-value pairs used in
    //   the rendering of the view
    // * The `controllers` parameter is a dictionary used to invoke other
    //   presenter. The value is the name of the presenter and the key is the
    //   name of the key to which **leslie** should bind the resolution of the
    //   presenter's render run.
    scene.stage = function (view, data, controllers) {
      if (typeof view !== 'string') {
        controllers = data;
        data = view;
        view = null;
      }
      if (typeof scene.mergeViewData === 'function') {
        data = data || {};
        scene.mergeViewData(data);
      }
      res({ view: view, data: data, controllers: controllers });
    };
    // `scene.cut` indicates that the render should end and an error sent back
    // to the client.
    scene.cut = function (o) {
      rej(o);
    };
    // `scene.block` provides the presenter with a way to indicate that it
    // should redirect to another URL.
    scene.block = function (href) {
      rej(codeError(302, new Error(href)));
    };
    // `scene.seen` provides the presenter with a way to indicate that its
    // content has not changed since the last request.
    scene.seen = function () {
      rej(codeError(304, new Error()));
    };
    // `scene.run` provides the presenter with a way to pipe a stream back to
    // the client.
    //
    // * `type` indicates the `Content-Type` of the reseponse.
    // * `pipe` contains the object that has a `pipe(OutputStream)` method on
    //    it to stream the content back to the client.
    // * `md5` contains an optional md5 hash of the content of the pipe.
    scene.run = function (type, pipe, md5) {
      res({ type: type, pipe: pipe, md5: md5 });
    };
    method(scene);
  });
}

// # Views
// Views represent some package of JavaScript functionality that **leslie**
// invokes to generate HTML for the client.

// ## Views as promises
// **leslie** uses promises to find, load, and render views. This method creates
// those promsises.
function viewPromise(directive, data, scene) {
  'use strict';
  return new rsvp.Promise(function (res, rej) {
    var code, format, parts;

    // Find the path to the correct view module.
    format = path.join(cwd, 'lib', '%s', 'views', '%s');
    parts = parseDirective(directive, format);

    // Prime the error code with "Not Found".
    code = 404;

    // Ask that the file exists. If it does, ...
    stat(parts.formattedFile)
      // ... then set the error code to "Internal Error" and laod the view
      // module. If that succeeds, ...
      .then(function () {
        code = 500;
        return require(parts.formattedPath);
      })
      // ... then get the key for the view and set the error code to "Not
      // Found". If the key exists, ...
      .then(function (catalog) {
        var viewKey = path.relative(cwd, parts.formattedPath);
        code = 404;
        if (catalog[viewKey] === undefined) {
          throw new Error('view ' + viewKey + ' not in the view catalog');
        }
        return catalog[viewKey];
      })
      // ... then set the error code to "Internal Error" and render the view. If
      // the view renders without error, ...
      .then(function (view) {
        code = 500;
        return view(data, {
          helpers: scene.helpers
        });
      })
      // ... then accept the promise with the generated HTML; otherwise, ...
      .then(function (html) {
        res(html);
      })
      // ... for any error that occurred along the promise resolution pipeline,
      // reject the promise with an appropriately coded error.
      .catch(function (e) {
        rej(codeError(code, e));
      });
  });
}

// # Presenters
// Presenters represent the coördinators of model and view. This is the P in
// MVP.

// ## Presenters as promises
// **leslie** uses promsies to find and load presenter objects and coördinate
// the invocation of the associated views. This method creates those promsises.
function controllerPromise(directive, scenes) {
  'use strict';
  var code, format, parts, scene, pipe;

  // Find the path to the correct presenter module.
  format = path.join(cwd, 'lib', '%s', 'controller');
  parts = parseDirective(directive, format);

  // Generate a scene from the supplied scene factory.
  scene = scenes();

  // Prime the error code to "Not Found".
  code = 404;

  // Default the request to a non-piped response.
  pipe = false;

  return new rsvp.Promise(function (res, rej) {
    // Ask that the file exists. If it does, ...
    stat(parts.formattedFile)
      // ... then set the error code to "Internal Error" and laod the presenter
      // module. If that succeeds, ...
      .then(function () {
        code = 500;
        return require(parts.formattedPath);
      })
      // ... then get the key for the presenter's method to invoke and set the
      // error code to "Not Found". If the key exists, then return the method
      // for the verb and ...
      .then(function (controller) {
        code = 404;
        if (controller[parts.verb] === undefined) {
          throw new Error('controller does not have verb ' + parts.verb);
        }
        return controller[parts.verb];
      })
      // ... create a scene promise with the newly-created scene and the method
      // for the presenter. Set the error code to "Internal Error". Return the
      // scene promise, ...
      .then(function (method) {
        code = 500;
        return scenePromise(scene, method);
      })
      // ... then collect the staged information from the scene:
      .then(function (staging) {
        var data, controllers;

        // * If the response should be piped, return the piped object
        if (staging.pipe) {
          pipe = true;
          return staging;
        }

        // * Normalize the view, data, and presenters from the scene.
        scene.view = staging.view;
        data = staging.data;
        if (data === undefined) {
          data = {};
        }
        controllers = staging.controllers || {};

        // * For each dependent presenter, create a promise to invoke it.
        Object.keys(controllers).forEach(function (key) {
          var value = controllers[key];

          if (typeof value === 'string') {
            data[key] = controllerPromise(value, scenes);
          }
        });

        // Return the data with any promised controllers rendered, as well.
        return rsvp.hash(data);
      })
      // With all of the rendered dependent views, return a view promise that
      // for the presenter.
      .then(function (data) {
        if (pipe) {
          return res(data);
        }
        if (scene.view) {
          directive = [parts.name, scene.view].join('#');
        }
        res(viewPromise(directive, data, scene));
      })
      // For any error that occurred along the promise resolution pipeline,
      // reject the promise with an appropriately coded error.
      .catch(function (e) {
        rej(codeError(code, e));
      });
  });
}

// # Responding to HTTP requests

// Create the prototypical object used by **leslie** to route requests.
/*jslint nomen: true*/
proto = {
  // `leslie.addMinion` allows applications to register global view helpers.
  addMinion: function (name, helper) {
    'use strict';
    this.minions = this.minions || {};
    this.minions[name] = helper;
  },

  // `leslie.setModifyScene` registers the application-specific callback invoked
  // by **leslie** for every scene creation.
  setModifyScene: function (fn) {
    'use strict';
    modifyScene = fn;
  },

  // `leslie.bother` returns an express-compatible method for handling requests.
  // It registers the method for the specific directive of format
  // "presenter#verb" for an express map registration. For example:
  //
  //     express.get('/actors', leslie.bother('actors#get'));
  bother: function (directive) {
    'use strict';
    var self, controller;

    self = this;
    directive = directive.split('#');
    controller = directive[0];

    return function (req, res, next) {
      var scenes, minions, invocation, callMethod;

      callMethod = req.method.toLowerCase();
      minions = self.minions || {};
      scenes = sceneFactory.bind(null, req, res, minions);

      if (req.body && req.body.__method__) {
        callMethod = req.body.__method__;
      }

      invocation = [ controller, callMethod ].join('#');

      controllerPromise(invocation, scenes)
        .then(function (value) {
          if (value.pipe !== undefined) {
            if (value.md5) {
              res.set('cache-control', 'public, max-age=31536000');
              res.set('etag', value.md5);
              res.set('content-type', value.type || 'application/octet-stream');
            }
            res.setHeader = false;
            return value.pipe(res);
          }
          res.send(200, value);
        })
        .catch(function (err) {
          if (err && err.statusCode === 302) {
            return res.redirect(err.message);
          }
          if (err && err.statusCode === 304) {
            return res.status(304).send('');
          }
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
