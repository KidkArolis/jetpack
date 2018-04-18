const path = require('path')
const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

module.exports = function (options) {
  const mode = options.cmd === 'build' || options.cmd === 'inspect'
    ? 'production'
    : 'development'

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
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            plugins: [
              require.resolve('@babel/plugin-syntax-dynamic-import')
            ],
            presets: [
              [
                require.resolve('@babel/preset-env'), {
                  modules: false,
                  targets: {
                    'browsers': 'last 2 versions'
                  }
                }
              ],
              [
                require.resolve('@babel/preset-react'), {
                  pragma: options.jsx
                }
              ]
            ]
          }
        }
      }, {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [
          require.resolve('style-loader'),
          require.resolve('css-loader'),
          {
            loader: require.resolve('postcss-loader'),
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      }, {
        test: /\.module\.css$/,
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: mode === 'production'
                ? '[name]--[local]___[hash:base64:5]'
                : '[path][name]--[local]___[hash:base64:5]'
            }
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ]
              }
            }
          }
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
        require.resolve('webpack-hot-middleware/client') + '?path=/client/__webpack_hmr&noInfo=true&reload=true',
        config.entry[e]
      ]
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
