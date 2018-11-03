const path = require('path')
const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

const rules = {
  js: require('./webpack.js.js'),
  css: require('./webpack.css.js'),
  cssm: require('./webpack.cssm.js')
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
      filename: mode === 'production' ? '[name].[chunkhash].js' : '[name].js',
      publicPath: '/client/'
    },
    module: {
      rules: [{
        oneOf: [
          rules.js(options),
          rules.css(options),
          rules.cssm(options)
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

  if (options.webpack) {
    const transformedConfig = options.webpack(config, options)
    if (transformedConfig) {
      config = transformedConfig
    }
  }

  return config
}
