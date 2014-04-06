module.exports = {
  'lib/test_controller/views/another_good_view': function(data, options) {
    return "it's still good!\n" + data.dependent;
  }
};