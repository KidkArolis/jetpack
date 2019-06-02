const MiniCssExtractPlugin = () => require('mini-css-extract-plugin')

module.exports = async (config, options) => {
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
          importLoaders: 1,
          sourceMap: false
        }
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          sourceMap: !!options.sourceMaps
        }
      },
      options.css.resources && {
        loader: require.resolve('sass-resources-loader'),
        options: {
          resources: options.css.resources,
          sourceMap: !!options.sourceMaps
        }
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          sourceMap: !!options.sourceMaps,
          ident: 'postcss'
        }
      }
    ].filter(x => x)
  })
}
