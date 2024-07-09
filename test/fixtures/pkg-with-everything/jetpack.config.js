const webpackConfigForTests = require('../../helpers/webpackConfigForTests')

module.exports = {
  minify: false,
  chunkLoadRetry: true,
  css: {
    features: {
      'nesting-rules': true
    }
  },
  webpack(config) {
    webpackConfigForTests(config)
  }
}
