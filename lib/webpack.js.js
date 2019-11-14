const browsers = require('./browsers')

module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs|jsx)$/,
    exclude: /(node_modules)/,
    use: [{
      loader: require.resolve('babel-loader'),
      options: {
        sourceType: 'unambiguous',
        plugins: [
          require.resolve('@babel/plugin-syntax-dynamic-import')
        ],
        presets: [
          [
            require.resolve('@babel/preset-env'), {
              useBuiltIns: 'usage',
              corejs: 3,
              modules: false,
              targets: {
                browsers: browsers.query(options)
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
    }]
  })

  // transpile node_modules
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs)$/,
    include (filepath) {
      if (filepath.startsWith(config.resolve.alias['core-js'])) return false
      if (filepath.startsWith(config.resolve.alias['regenerator-runtime'])) return false
      if (filepath.includes('node_modules/core-js/')) return false
      if (filepath.includes('node_modules/react-hot-loader/')) return false
      if (filepath.includes('node_modules/webpack/')) return false
      return true
    },
    use: [{
      loader: require.resolve('babel-loader'),
      options: {
        babelrc: false,
        configFile: false,
        compact: false,
        sourceMaps: false,
        sourceType: 'unambiguous',
        plugins: [
          require.resolve('@babel/plugin-syntax-dynamic-import')
        ],
        presets: [
          [
            require.resolve('@babel/preset-env'), {
              useBuiltIns: 'usage',
              corejs: 3,
              modules: false,
              // Exclude transforms that make all code slower
              // Taken from preact/CRA
              exclude: ['transform-typeof-symbol']
            }
          ]
        ]
      }
    }]
  })

  if (options.production) {
    if (options.minify) {
      const Terser = require('terser-webpack-plugin')
      config.plugins.push(new Terser({
        cache: true,
        parallel: true,
        sourceMap: !!options.sourceMaps,
        terserOptions: {
          mangle: true,
          compress: true,
          output: {
            comments: false
          }
        }
      }))
    } else {
      config.optimization.minimizer = []
    }
  }
}
