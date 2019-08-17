module.exports = {
  css: {
    modules: true
  },

  proxy: {
    '/api/*': 'http://localhost:3040'
  },

  webpack: (config, options) => {
    config.resolve = {
      ...config.resolve,
      extensions: ['.js', '.css']
    }
    return config
  }
}
