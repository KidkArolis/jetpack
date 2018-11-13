const path = require('path')
const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

const plugins = {
  js: require('./webpack.js'),
  css: require('./webpack.css'),
  files: require('./webpack.files')
}

module.exports = async function (options) {
  let config = {
    entry: {
      bundle: options.entry
    },
    mode: options.production ? 'production' : 'development',
    devtool: options.production ? undefined : 'source-map',
    output: {
      path: options.production
        ? path.join(process.cwd(), options.dist, 'client')
        : path.join(process.cwd(), 'client'),
      filename: options.production ? '[name].[chunkhash:8].js' : '[name].js',
      chunkFilename: options.production ? '[name].[chunkhash:8].chunk.js' : '[name].js',
      publicPath: '/client/'
    },
    module: {
      rules: [{
        oneOf: []
      }]
    },
    plugins: [
      new FriendlyErrorsWebpackPlugin({ clearConsole: false }),
      new ManifestPlugin()
    ],
    devServer: {
      logLevel: 'silent',
      noInfo: true,
      publicPath: '/client/'
    }
  }

  if (options.production) {
    config.optimization = {
      splitChunks: {
        chunks: 'all'
      },
      runtimeChunk: true
    }
  }

  if (!options.production && options.hot) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/client/__webpack_hmr&noInfo=true&reload=true'
      ].concat(config.entry[e])
    })
  }

  await plugins.js(config, options)
  await plugins.css(config, options)
  await plugins.files(config, options)

  if (options.webpack) {
    config = (await options.webpack(config, options)) || config
  }

  return config
}
