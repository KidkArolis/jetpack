const webpackConfigForTests = require('../../helpers/webpackConfigForTests')

module.exports = {
  minify: false,
  gzip: true,
  css: {
    features: {
      'nesting-rules': true
    }
  },
  webpack (config) {
    webpackConfigForTests(config)
  }
}
