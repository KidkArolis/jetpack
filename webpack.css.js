module.exports = (options) => ({
  test: /\.css$/,
  exclude: /\.module\.css$/,
  use: [
    {
      loader: require.resolve('style-loader')
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
