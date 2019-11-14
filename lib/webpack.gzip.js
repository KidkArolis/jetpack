module.exports = (config, options) => {
  if (options.production && options.gzip) {
    const CompressionPlugin = require('compression-webpack-plugin')
    config.plugins.push(new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|styl|less|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    }))
    const BrotliPlugin = require('brotli-webpack-plugin')
    config.plugins.push(new BrotliPlugin({
      asset: '[path].br[query]',
      test: /\.(js|styl|less|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    }))
  }
}
