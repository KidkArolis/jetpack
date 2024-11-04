const rspackConfigForTests = require('../../helpers/rspackConfigForTests')

module.exports = {
  minify: false,
  chunkLoadRetry: true,
  css: {
    features: {
      'nesting-rules': true
    }
  },
  rspack(config) {
    rspackConfigForTests(config)
  }
}
