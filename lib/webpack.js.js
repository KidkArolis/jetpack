const browsers = require('./browsers')

module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs|jsx)$/,
    exclude: /(node_modules)/,
    use: [
      {
        loader: require.resolve('swc-loader'),
        options: {
          env: {
            targets: browsers.query(options),
            coreJs: 3,
            mode: 'entry'
          },
          jsc: {
            parser: {
              jsx: true,
              exportDefaultFrom: true
            },
            transform: {}
          }
        }
      }
    ]
  })

  // transpile node_modules
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs)$/,
    include(filepath) {
      if (filepath.startsWith(config.resolve.alias['core-js'])) return false
      if (filepath.startsWith(config.resolve.alias['regenerator-runtime'])) return false
      if (filepath.includes('node_modules/core-js/')) return false
      if (filepath.includes('node_modules/react-hot-loader/')) return false
      if (filepath.includes('node_modules/webpack/')) return false
      return true
    },
    use: [
      {
        loader: require.resolve('swc-loader'),
        options: {
          env: {
            targets: browsers.query(options),
            coreJs: 3,
            mode: 'entry',
            exclude: ['transform-typeof-symbol']
          },
          jsc: {
            parser: {
              jsx: true,
              exportDefaultFrom: true
            },
            transform: {}
          }
        }
      }
    ]
  })

  if (options.production) {
    if (options.minify) {
      const TerserPlugin = require('terser-webpack-plugin')
      config.plugins.push(
        new TerserPlugin({
          minify: TerserPlugin.swcMinify,
          parallel: true,
          terserOptions: {
            mangle: true,
            compress: true
          }
        })
      )
    } else {
      config.optimization.minimizer = []
    }
  }
}
