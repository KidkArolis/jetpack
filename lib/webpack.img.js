module.exports = (config, options) => {
  config.module.rules[0].oneOf.push({
    test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
    loader: require.resolve('url-loader'),
    options: {
      limit: 10000,
      name: '[name].[hash:8].[ext]'
    }
  })
}
