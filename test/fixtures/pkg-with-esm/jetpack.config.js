const webpackConfigForTests = require('../../helpers/webpackConfigForTests')

module.exports = {
  minify: false,
  webpack (config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
    webpackConfigForTests(config)
  }
}
