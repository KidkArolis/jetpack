const fs = require('fs')
const path = require('path')

module.exports = {
  css: {
    modules: true
  },

  hooks: {
    afterBuild (options) {
      console.log('Writing', path.join(options.dir, options.dist, '_redirects'))
      fs.writeFileSync(path.join(options.dir, options.dist, '_redirects'), `
        /*    /index.html   200
      `)
    }
  },

  webpack (config, options) {
    config.resolve = {
      extensions: ['.js', '.css']
    }
    return config
  }
}
