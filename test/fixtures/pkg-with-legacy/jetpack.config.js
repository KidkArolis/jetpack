const rspackConfigForTests = require('../../helpers/rspackConfigForTests')

module.exports = {
  minify: false,
  target: {
    modern: true,
    legacy: true
  },
  rspack(config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
    rspackConfigForTests(config)
  }
}
