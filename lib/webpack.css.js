const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.css$/,
    use: [
      {
        loader: options.production ? MiniCssExtractPlugin.loader : require.resolve('style-loader')
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
          ident: 'postcss',
          plugins: () => [
            require('postcss-import')(),
            require('postcss-preset-env')({
              features: options.css.features,
              browsers: options.browsers
            })
          ]
        }
      }
    ]
  })

  if (options.production) {
    config.plugins.push(new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }))
  }
}
