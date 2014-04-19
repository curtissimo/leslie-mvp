var leslie, util;

leslie = require('../leslie');
util = require('util');

exports['returns name, verb, path, and file for full directive'] = function(t) {
  var controller, directive, expectedFile, expectedPath, format, value, verb;

  controller = 'mycontroller';
  format = '%s/%s';
  verb = 'smack';
  directive = [ controller, '#', verb ].join('');
  expectedPath = util.format(format, controller, verb);
  expectedFile = expectedPath + '.js';

  value = leslie._parseDirective(directive, format);

  t.ok(value);
  t.strictEqual(value.name, controller);
  t.strictEqual(value.verb, verb);
  t.strictEqual(value.formattedFile, expectedFile);
  t.strictEqual(value.formattedPath, expectedPath);
  t.done();
};

exports['returns get as the verb for verbless directives'] = function(t) {
  var controller, expectedFile, expectedPath, format, value, verb;

  controller = 'mycontroller';
  format = '%s/%s';
  verb = 'get';
  expectedPath = util.format(format, controller, verb);
  expectedFile = expectedPath + '.js';

  value = leslie._parseDirective(controller, format);

  t.ok(value);
  t.strictEqual(value.name, controller);
  t.strictEqual(value.verb, verb);
  t.strictEqual(value.formattedFile, expectedFile);
  t.strictEqual(value.formattedPath, expectedPath);
  t.done();
};
