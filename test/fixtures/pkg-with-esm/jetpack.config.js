const rspackConfigForTests = require('../../helpers/rspackConfigForTests')

module.exports = {
  minify: false,
  rspack(config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
    rspackConfigForTests(config)
  }
}
