module.exports = {
  plugins: {
    '../../../postcss-preset-env': {
      features: {
        'nesting-rules': true,
        'custom-media-queries': true
      }
    }
  }
}
