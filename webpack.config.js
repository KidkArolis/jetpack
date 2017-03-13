const path = require('path')
const webpack = require('webpack')

module.exports = function (options) {
  const config = {
    entry: {
      bundle: '.'
    },
    output: {
      path: path.join(process.cwd(), 'dist/'),
      filename: '[name].js',
      publicPath: '/dist/'
    },
    devtool: 'source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
        }
      })
    ],
    module: {
      loaders: [{
        test: /.js$/,
        loaders: require.resolve('buble-loader'),
        query: {
          jsx: options.jsx,
          objectAssign: 'Object.assign'
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
      hot: true,
      inline: true,
      publicPath: '/dist/',
      historyApiFallback: {
        index: '/dist/'
      },
      stats: {
        errors: true,
        errorDetails: true,
        warnings: false
      }
    }
  }

  if (options.build) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }))
  } else {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [config.entry[e], require.resolve('webpack-hot-middleware/client')]
    })
  }

  return config
}
