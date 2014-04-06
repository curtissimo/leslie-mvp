var leslie, util;

leslie = require('../leslie');
util = require('util');

exports['returns code on error'] = function(t) {
  var code, error, value;

  code = 400;
  error = new Error();

  value = leslie._codeError(code, error);

  t.strictEqual(value.statusCode, code);
  t.strictEqual(value, error);
  t.done();
};

exports['creates error if none provided'] = function(t) {
  var code, value;

  code = 400;

  value = leslie._codeError(code);

  t.ok(util.isError(value));
  t.strictEqual(value.statusCode, code);
  t.done();
};

exports['creates error from message if provided'] = function(t) {
  var code, message, value;

  code = 400;
  message = 'Hello, Leslie.';

  value = leslie._codeError(code, message);

  t.ok(util.isError(value));
  t.strictEqual(value.message, message);
  t.strictEqual(value.statusCode, code);
  t.done();
};
