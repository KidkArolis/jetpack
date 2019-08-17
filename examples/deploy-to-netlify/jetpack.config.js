const fs = require('fs')
const path = require('path')

module.exports = {
  css: {
    modules: true
  },

  webpack (config, options) {
    config.resolve = {
      ...config.resolve,
      extensions: ['.js', '.css']
    }
    return config
  }
}
