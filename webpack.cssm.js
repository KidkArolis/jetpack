module.exports = (options) => ({
  test: /\.module\.css$/,
  use: [
    {
      loader: require.resolve('style-loader')
    },
    {
      loader: require.resolve('css-loader'),
      options: {
        modules: true,
        import: false,
        importLoaders: 1,
        minimize: options.env === 'production',
        sourceMap: false,
        localIdentName: options.mode === 'production'
          ? '[name]--[local]___[hash:base64:5]'
          : '[path][name]--[local]___[hash:base64:5]'
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
