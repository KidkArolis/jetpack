module.exports = {
  minify: false,
  webpack(config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
  }
}
