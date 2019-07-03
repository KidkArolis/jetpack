const webpackConfigForTests = require('../../helpers/webpackConfigForTests')

module.exports = {
  minify: false,
  target: {
    modern: true,
    legacy: true
  },
  webpack (config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
    webpackConfigForTests(config)
  }
}
