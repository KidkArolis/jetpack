const webpackConfigForTests = require('../../helpers/webpackConfigForTests')

module.exports = {
  minify: false,
  css: {
    features: {
      'nesting-rules': true
    }
  },
  webpack(config) {
    webpackConfigForTests(config)
  }
}
