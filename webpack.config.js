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
      bundle: [require.resolve('@babel/polyfill'), options.client]
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
                    'browsers': options.browsers
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
          {
            loader: require.resolve('css-loader'),
            options: {
              import: false,
              importLoaders: 1,
              minimize: options.env === 'production',
              sourceMap: false
            }
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              sourceMap: options.env !== 'production',
              ident: 'postcss',
              plugins: {
                [require.resolve('postcss-import')]: {
                  features: options.css.features
                },
                [require.resolve('postcss-preset-env')]: {
                  browsers: options.browsers
                }
              ]
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
              import: false,
              importLoaders: 1,
              minimize: options.env === 'production',
              sourceMap: false,
              localIdentName: mode === 'production'
                ? '[name]--[local]___[hash:base64:5]'
                : '[path][name]--[local]___[hash:base64:5]'
            }
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              sourceMap: options.env !== 'production',
              ident: 'postcss',
              plugins: {
                [require.resolve('postcss-import')]: {
                  features: options.css.features
                },
                [require.resolve('postcss-preset-env')]: {
                  browsers: options.browsers
                }
              ]
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
