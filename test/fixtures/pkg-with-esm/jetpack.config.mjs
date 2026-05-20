export default {
  build: {
    minify: false
  },
  rspack(config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
  }
}
