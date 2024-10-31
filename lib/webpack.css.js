const postcssrc = require('postcss-load-config')
const browsers = require('./browsers')

module.exports = async (config, options) => {
  // allow overriding postcss config
  let postcssConfigExists = true
  try {
    await postcssrc({}, options.dir)
  } catch (err) {
    postcssConfigExists = false
  }

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
          import: false,
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
        loader: require.resolve('postcss-loader'),
        options: {
          sourceMap: !!options.sourceMaps,
          ...(!postcssConfigExists && {
            postcssOptions: {
              plugins: [
                require('postcss-import')(),
                require('postcss-flexbugs-fixes')(),
                require('postcss-preset-env')({
                  browsers: browsers.query(options),
                  autoprefixer: {
                    browsers: undefined,
                    overrideBrowserslist: browsers.query(options)
                  },
                  features: options.css.features
                })
              ].filter(Boolean)
            }
          })
        }
      }
    ]
  })

  if (options.production) {
    const MiniCssExtractPlugin = require('@rspack/core').CssExtractRspackPlugin
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash:8].css',
        chunkFilename: '[name].[contenthash:8].chunk.css'
      })
    )
    if (options.minify) {
      const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
      config.optimization.minimizer.push(new CssMinimizerPlugin())
    }
  }
}
