const postcssrc = require('postcss-load-config')
const browsers = require('./browsers')
const MiniCssExtractPlugin = () => require('@rspack/core').CssExtractRspackPlugin

module.exports = async (config, options) => {
  // allow overriding postcss config
  let postcssConfigExists = true
  try {
    await postcssrc({}, options.dir)
  } catch (err) {
    postcssConfigExists = false
  }

  config.module.rules[0].oneOf.push({
    test: /\.scss$/,
    use: [
      {
        loader: options.production ? MiniCssExtractPlugin().loader : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          import: false,
          importLoaders: options.css.resources ? 3 : 2,
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
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          api: 'modern-compiler',
          implementation: require.resolve('sass-embedded')
        }
      },
      options.css.resources && {
        loader: require.resolve('sass-resources-loader'),
        options: {
          resources: options.css.resources,
          sourceMap: !!options.sourceMaps
        }
      }
    ].filter((x) => x)
  })
}
