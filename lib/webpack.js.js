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
            mode: 'usage'
          },
          jsc: {
            parser: {
              syntax: 'ecmascript',
              exportDefaultFrom: true,
              jsx: true
            },
            externalHelpers: true,
            transform: {}
          },
          isModule: 'unknown'
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
      if (filepath.startsWith(config.resolve.alias['@swc/helpers'])) return false
      if (filepath.includes('node_modules/ansi-html-community/')) return false
      if (filepath.includes('node_modules/ansi-regex/')) return false
      if (filepath.includes('node_modules/core-js/')) return false
      if (filepath.includes('node_modules/css-loader/')) return false
      if (filepath.includes('node_modules/html-entities/')) return false
      if (filepath.includes('node_modules/strip-ansi/')) return false
      if (filepath.includes('node_modules/style-loader/')) return false
      if (filepath.includes('node_modules/webpack-hot-middleware/')) return false

      return true
    },
    use: [
      {
        loader: require.resolve('swc-loader'),
        options: {
          env: {
            targets: browsers.query(options),
            coreJs: 3,
            mode: 'usage'
          },
          jsc: {
            parser: {
              syntax: 'ecmascript',
              exportDefaultFrom: true,
              jsx: true
            },
            externalHelpers: true,
            transform: {}
          },
          isModule: 'unknown'
        }
      }
    ]
  })

  if (options.production) {
    config.optimization.minimizer = options.minify
      ? [
          new (require('@rspack/core').SwcJsMinimizerRspackPlugin)({
            minimizerOptions: {
              mangle: true,
              compress: true
            }
          })
        ]
      : []
  }
}
