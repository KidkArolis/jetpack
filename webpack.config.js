const path = require('path')
const webpack = require('webpack')
const requireRelative = require('require-relative')

const env = process.env.NODE_ENV || 'development'

module.exports = function (options) {
  const config = {
    entry: {
      bundle: options.client === '.' ? '.' : requireRelative.resolve(options.client, process.cwd())
    },
    output: {
      path: path.join(process.cwd(), 'dist/'),
      filename: '[name].js',
      publicPath: '/dist/'
    },
    devtool: 'source-maps',
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
              [require.resolve('babel-preset-env'), { modules: false }],
              // TODO - use the underlying modules + prgamatic jsx,
              // to get support for alt pragrams
              require.resolve('babel-preset-react')
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
      publicPath: '/dist/',
      stats: {
        colors: true
      }
    }
  }

  if (options.build) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }))
  }

  if (!options.build && !options.start && options.hot) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/dist/__webpack_hmr',
        config.entry[e]
      ]
    })
  }

  return config
}
