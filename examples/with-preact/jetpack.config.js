module.exports = {
  css: {
    modules: true
  },
  webpack: (config, options) => {
    config.resolve = {
      extensions: ['.js', '.css']
    }
    return config
  }
}
