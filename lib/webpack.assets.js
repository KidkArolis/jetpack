module.exports = (config, options) => {
  config.output.assetModuleFilename = '[name].[hash:8][ext]'
  config.module.rules[0].oneOf.push({
    test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
    type: 'asset/resource',
  })
}
