const path = require('path')
const webpack = require('webpack')

const env = process.env.NODE_ENV || 'development'

module.exports = function (options) {
  const config = {
    entry: {
      bundle: options.client
    },
    output: {
      path: options.cmd === 'build' ? path.join(process.cwd(), options.dist, 'client') : path.join(process.cwd(), 'client'),
      filename: '[name].js',
      publicPath: '/client/'
    },
    devtool: options.cmd !== 'build' && 'cheap-module-eval-source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(env)
        }
      })
    ],
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
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
        loaders: [
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
      }]
    },
    devServer: {
      noInfo: true,
      publicPath: '/client/',
      stats: {
        colors: true
      }
    }
  }

  if (options.cmd === 'build') {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }))
  }

  if (options.cmd !== 'build' && options.cmd !== 'start' && options.hot) {
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
