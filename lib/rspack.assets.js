export default (config, options) => {
  const inlineLimit = options.assets?.inlineLimit ?? 8096

  config.module.rules[0].oneOf.push({
    test: /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?.*)?$/i,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: inlineLimit
      }
    }
  })

  config.module.rules[0].oneOf.push({
    test: /\.(woff2?|ttf|eot)(\?.*)?$/i,
    type: 'asset/resource'
  })

  config.module.rules[0].oneOf.push({
    test: /\.(aac|flac|m4a|mp3|ogg|opus|wav|m4v|mov|mp4|webm)(\?.*)?$/i,
    type: 'asset/resource'
  })
}
