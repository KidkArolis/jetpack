const path = require('path')
const ManifestPlugin = require('webpack-manifest-plugin')

const plugins = {
  js: require('./webpack.js'),
  css: require('./webpack.css'),
  files: require('./webpack.files'),
  hot: require('./webpack.hot')
}

module.exports = async function (options) {
  let config = {
    entry: {
      bundle: options.entry
    },
    output: {
      path: path.join(process.cwd(), 'assets'),
      filename: '[name].js',
      chunkFilename: '[name].js',
      publicPath: '/assets/'
    },
    mode: 'development',
    devtool: options.sourceMaps,
    module: {
      rules: [{
        oneOf: []
      }]
    },
    optimization: {
      minimizer: []
    },
    plugins: [
      new ManifestPlugin()
    ],
    devServer: {
      logLevel: 'silent',
      noInfo: true,
      publicPath: '/assets/'
    }
  }

  if (options.production) {
    config.mode = 'production'
    config.output.path = path.join(process.cwd(), options.dist, 'assets')
    config.output.filename = '[name].[chunkhash:8].js'
    config.output.chunkFilename = '[name].[chunkhash:8].chunk.js'
    config.optimization.splitChunks = { chunks: 'all' }
    config.optimization.runtimeChunk = true
  }

  await plugins.js(config, options)
  await plugins.css(config, options)
  await plugins.files(config, options)
  await plugins.hot(config, options)

  if (options.webpack) {
    config = (await options.webpack(config, options)) || config
  }

  return config
}
