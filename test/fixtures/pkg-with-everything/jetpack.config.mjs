import rspackConfigForTests from '../../helpers/rspackConfigForTests.js'

export default {
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
