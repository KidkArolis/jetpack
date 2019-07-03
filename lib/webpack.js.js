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
