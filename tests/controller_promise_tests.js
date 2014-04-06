var leslie;

leslie = require('../leslie');

module.exports = {
  'controller promise rejects with a': {
    '404 for a non-existent controller module': function (t) {
      leslie._controllerPromise('no_controller', this.scenes)
        .then(function () {
          t.ok(false, 'no controller should fail with a 404');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 404);
          t.done();
        })
    },

    '500 for a badly-formatted controller module': function (t) {
      leslie._controllerPromise('bad_controller', this.scenes)
        .then(function () {
          t.ok(false, 'badly-formatted controller should fail with a 500');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        })
    },

    '404 for a controller without a verb method': function (t) {
      leslie._controllerPromise('test_controller#no_verb', this.scenes)
        .then(function () {
          t.ok(false, 'controller without a verb handler should fail with a 404');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 404);
          t.done();
        })
    },

    '500 when the verb handler throws an error': function (t) {
      leslie._controllerPromise('test_controller#throw', this.scenes)
        .then(function () {
          t.ok(false, 'verb handler that throws an error should fail with a 500');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        })
    },

    '500 when the verb handler rejects with an error': function (t) {
      leslie._controllerPromise('test_controller#reject', this.scenes)
        .then(function () {
          t.ok(false, 'verb handler that rejects should fail with a 500');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        })
    },

    '500 when a called controller verb handler throws an error': function (t) {
      leslie._controllerPromise('test_controller#call_a_bad_one', this.scenes)
        .then(function () {
          t.ok(false, 'called controller that throws should fail with a 500');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        })
    },

    '500 when a called controller rejects with an error': function (t) {
      leslie._controllerPromise('test_controller#call_another', this.scenes)
        .then(function () {
          t.ok(false, 'called controller that rejects should fail with a 500');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        })
    }
  },

  'controller promise resolves with a': {
    'data-only verb handler': function (t) {
      leslie._controllerPromise('test_controller#all_is_good', this.scenes)
        .then(function (html) {
          t.strictEqual(html, "it's all good!");
          t.done();
        })
        .catch(function (e) {
          t.ok(false, 'we should not have had an error');
          t.done();
        });
    },

    'verb handler with controllers that do not fail': function (t) {
      leslie._controllerPromise('test_controller#another_good_view', this.scenes)
        .then(function (html) {
          t.strictEqual(html, "it's still good!\nit's all good!");
          t.done();
        })
        .catch(function (e) {
          t.ok(false, 'we should not have had an error');
          t.done();
        });
    }
  },

  'setUp': function (callback) {
    this.scenes = function () {
      return {};
    };
    callback();
  }
};
