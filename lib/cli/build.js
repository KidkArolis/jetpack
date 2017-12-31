const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const wpConf = require('../../webpack.config')

module.exports = function (options) {
  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)
  process.env.NODE_ENV = 'production'
  compiler.run(async function (err, stats) {
    if (err) return console.log(err)
    if (options.static) {
      await fs.copy(options.static, path.join(options.cwd, options.dist, options.static))
    }
    console.log(stats.toString())
  })
}
