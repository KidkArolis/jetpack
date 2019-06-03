const path = require('path')

module.exports = (config, options) => {
  // important for when jetpack is used without installing it locally
  // without this, webpack can't find core-js that @babel/preset-env puts in
  config.resolve.alias['core-js'] = path.dirname(require.resolve('core-js'))

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
