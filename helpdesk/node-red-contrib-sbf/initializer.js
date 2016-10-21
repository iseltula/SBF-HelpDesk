var APP = null;
module.exports = {
  init: function(app, options) {
    APP = app;
  },
  getApp: function() {
    return APP;
  }
}
