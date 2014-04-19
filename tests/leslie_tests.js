var leslie = require('../leslie');

exports.module = {
  'leslie has no minions at creation': function (t) {
    var minionNames = Object.keys(leslie.minions);

    t.strictEqual(minionNames.length, 0);
    t.done();
  },

  'add minion adds a minion': function (t) {
    var minionName, minion;

    minionName = 'gabby';
    minion = {};

    leslie.addMinion(minionName, minion);

    t.strictEqual(leslie.minions[minionName], minion);
    t.done();
  },

  'bother returns a function': function (t) {
    t.strictEqual(typeof leslie.bother(''), 'function');
    t.done();
  }
}