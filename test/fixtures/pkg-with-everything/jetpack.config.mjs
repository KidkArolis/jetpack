import rspackConfigForTests from '../../helpers/rspackConfigForTests.js'

export default {
  minify: false,
  chunkLoadRetry: true,
  rspack(config) {
    rspackConfigForTests(config)
  }
}
