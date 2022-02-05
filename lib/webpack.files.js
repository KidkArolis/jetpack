module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
    use: [
      {
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
          name: '[name].[hash:8].[ext]'
        }
      }
    ]
  })
}
