const path = require('path')
const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const rules = {
  js: require('./webpack.js'),
  css: require('./webpack.css'),
  cssm: require('./webpack.cssm')
}

module.exports = function (options) {
  const mode = options.cmd === 'build' || options.cmd === 'inspect'
    ? 'production'
    : 'development'

  options = Object.assign({}, options, { mode })

  let config = {
    entry: {
      bundle: options.client
    },
    mode,
    devtool: mode === 'development' ? 'source-map' : undefined,
    output: {
      path: mode === 'production' ? path.join(process.cwd(), options.dist, 'client') : path.join(process.cwd(), 'client'),
      filename: mode === 'production' ? '[name].[chunkhash:8].js' : '[name].js',
      chunkFilename: mode === 'production' ? '[name].[chunkhash:8].chunk.js' : '[name].js',
      publicPath: '/client/'
    },
    module: {
      rules: [{
        oneOf: [
          rules.js(options),
          options.css.modules ? rules.cssm(options) : rules.css(options)
        ]
      }]
    },
    plugins: [
      new FriendlyErrorsWebpackPlugin({
        clearConsole: false
      }),
      new ManifestPlugin()
    ],
    devServer: {
      logLevel: 'silent',
      noInfo: true,
      publicPath: '/client/'
    }
  }

  if (mode === 'production') {
    config.optimization = {
      splitChunks: {
        chunks: 'all'
      }
    }
  }

  if (mode !== 'production' && options.hot) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/client/__webpack_hmr&noInfo=true&reload=true'
      ].concat(config.entry[e])
    })
  }

  if (mode === 'production') {
    config.plugins.push(new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }))
  }

  if (options.webpack) {
    const transformedConfig = options.webpack(config, options)
    if (transformedConfig) {
      config = transformedConfig
    }
  }

  return config
}
