var leslie;

leslie = require('../leslie');

module.exports = {
  'view promise rejects with a': {
    '404 for a non-existent view file': function (t) {
      leslie._viewPromise('test_controller#unknown')
        .then(function () {
          t.ok(false, 'expected 404 for non-existent view.js');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 404);
          t.done();
        });
    },

    '500 for a syntactically incorrect view file': function (t) {
      leslie._viewPromise('test_controller#bad_format')
        .then(function () {
          t.ok(false, 'expected 500 for non-existent view.js');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        });
    },

    '404 for a view not in the catalog': function (t) {
      leslie._viewPromise('test_controller#not_in_catalog')
        .then(function () {
          t.ok(false, 'expected 404 for view not in catalog');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 404);
          t.done();
        });
    },

    '500 for an error in the view': function (t) {
      var scene = { helpers: {}};
      leslie._viewPromise('test_controller#view_throws_error', {}, scene)
        .then(function () {
          t.ok(false, 'expected 500 for view not in catalog');
          t.done();
        })
        .catch(function (e) {
          t.ok(e);
          t.strictEqual(e.statusCode, 500);
          t.done();
        });
    }
  },

  'view promise succeeds when all is right': function (t) {
    var scene = { helpers: {}};
    leslie._viewPromise('test_controller#all_is_good', {}, scene)
      .then(function (html) {
        t.strictEqual(html, "it's all good!");
        t.done();
      })
      .catch(function (e) {
        t.ok(false, 'we should not have had an error');
        t.done();
      });
  }
};
