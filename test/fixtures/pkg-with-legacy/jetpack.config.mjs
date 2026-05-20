export default {
  build: {
    minify: false
  },
  target: 'all',
  rspack(config) {
    delete config.optimization.splitChunks
    delete config.optimization.runtimeChunk
  }
}
