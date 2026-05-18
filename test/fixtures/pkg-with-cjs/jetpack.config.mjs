import rspackConfigForTests from '../../helpers/rspackConfigForTests.js'

export default {
  minify: false,
  rspack(config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
    rspackConfigForTests(config)
  }
}
