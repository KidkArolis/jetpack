const Terser = require('terser-webpack-plugin')

module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs|jsx)/,
    exclude: /(node_modules)/,
    use: [{
      loader: require.resolve('babel-loader'),
      options: {
        plugins: [
          require.resolve('@babel/plugin-syntax-dynamic-import')
        ],
        presets: [
          [
            require.resolve('@babel/preset-env'), {
              useBuiltIns: 'usage',
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
    }]
  })

  if (options.production) {
    if (options.minify) {
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
