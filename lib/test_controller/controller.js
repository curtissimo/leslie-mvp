module.exports = {
  throw: function (scene) {
    throw new Error();
  },

  reject: function (scene) {
    scene.cut();
  },

  call_another: function (scene) {
    scene.stage({}, {
      me: 'test_controller#reject'
    });
  },

  all_is_good: function (scene) {
    scene.stage({});
  },

  another_good_view: function (scene) {
    scene.stage({}, {
      dependent: 'test_controller#all_is_good'
    });
  },

  call_a_bad_one: function (scene) {
    scene.stage({}, {
      dependent: 'test_controller#throw'
    });
  }
};
