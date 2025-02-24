const browsers = require('./browsers')

module.exports = async (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    exclude: [/\.global\.css$/, /node_modules/],
    use: [
      {
        loader: options.production
          ? require('@rspack/core').CssExtractRspackPlugin.loader
          : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          sourceMap: false,
          ...(options.css.modules && {
            modules: {
              localIdentName:
                options.mode === 'production'
                  ? '[name]--[local]___[hash:base64:5]'
                  : '[path][name]--[local]___[hash:base64:5]'
            }
          })
        }
      },
      {
        loader: 'builtin:lightningcss-loader',
        options: {
          sourceMap: !!options.sourceMaps,
          targets: browsers.query(options),
          include: options.css?.features?.include,
          exclude: options.css?.features?.exclude
        }
      }
    ]
  })

  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    use: [
      {
        loader: options.production
          ? require('@rspack/core').CssExtractRspackPlugin.loader
          : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          sourceMap: false
        }
      },
      {
        loader: 'builtin:lightningcss-loader',
        options: {
          sourceMap: !!options.sourceMaps,
          targets: browsers.query(options),
          include: options.css?.features?.include,
          exclude: options.css?.features?.exclude
        }
      }
    ]
  })

  if (options.production) {
    const { CssExtractRspackPlugin } = require('@rspack/core')
    config.plugins.push(
      new CssExtractRspackPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[name].[contenthash:8].chunk.css',
        // if css modules are used in the project, then
        // the order should not matter (unless :global() is used)
        ignoreOrder: options.css.modules
      })
    )
    if (options.minify) {
      const { LightningCssMinimizerRspackPlugin } = require('@rspack/core')
      config.optimization.minimizer.push(new LightningCssMinimizerRspackPlugin())
    }
  }
}
