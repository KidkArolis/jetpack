export default (config) => {
  config.module.rules[0].oneOf.push({
    test: /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp|woff2?|ttf|eot|aac|flac|m4a|mp3|ogg|opus|wav|m4v|mov|mp4|webm)(\?.*)?$/i,
    type: 'asset'
  })
}
