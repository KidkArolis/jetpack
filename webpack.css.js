const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = (options) => ({
  test: /\.css$/,
  use: [
    {
      loader: options.env === 'production' ? MiniCssExtractPlugin.loader : require.resolve('style-loader')
    },
    {
      loader: require.resolve('css-loader'),
      options: {
        import: false,
        importLoaders: 1,
        minimize: options.env === 'production',
        sourceMap: false
      }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        sourceMap: options.env !== 'production',
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
