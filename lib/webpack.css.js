const postcssrc = require('postcss-load-config')
const MiniCssExtractPlugin = () => require('mini-css-extract-plugin')

module.exports = async (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    use: [
      {
        loader: options.production ? MiniCssExtractPlugin().loader : require.resolve('style-loader')
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          import: false,
          importLoaders: 1,
          minimize: options.production,
          sourceMap: false
        }
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          sourceMap: !!options.sourceMaps,
          ident: 'postcss'
        }
      }
    ]
  })

  // css modules
  if (options.css.modules) {
    config.module.rules[0].oneOf.forEach(rule => {
      rule.use.forEach(loader => {
        if (loader.loader === require.resolve('css-loader')) {
          Object.assign(loader.options, {
            modules: true,
            localIdentName: options.mode === 'production'
              ? '[name]--[local]___[hash:base64:5]'
              : '[path][name]--[local]___[hash:base64:5]'
          })
        }
      })
    })
  }

  // allow overriding postcss config
  let postcssConfigExists = true
  try {
    await postcssrc({}, options.dir)
  } catch (err) {
    postcssConfigExists = false
  }

  if (!postcssConfigExists) {
    config.module.rules[0].oneOf.forEach(rule => {
      rule.use.forEach(loader => {
        if (loader.loader === require.resolve('postcss-loader')) {
          loader.options.plugins = [
            require('postcss-import')(),
            require('postcss-flexbugs-fixes')(),
            require('postcss-preset-env')({
              features: options.css.features
            })
          ].filter(Boolean)
        }
      })
    })
  }

  if (options.production) {
    config.plugins.push(new (MiniCssExtractPlugin())({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }))
    if (options.minify) {
      const OptimizeCss = require('optimize-css-assets-webpack-plugin')
      config.plugins.push(new OptimizeCss())
    }
  }
}
