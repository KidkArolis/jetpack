import rspackConfigForTests from '../../helpers/rspackConfigForTests.js'

export default {
  build: {
    minify: false,
    chunkLoadRetry: true
  },
  rspack(config) {
    rspackConfigForTests(config)
  }
}
