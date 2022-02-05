const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const wpConf = require('./webpack.config')

module.exports = async function (options, log) {
  log.info('Generating report...')
  process.env.NODE_ENV = 'production'
  const webpackConfigs = await wpConf(options)
  const webpackConfig = !options.target.modern ? webpackConfigs.legacy : webpackConfigs.modern
  webpackConfig.plugins = webpackConfig.plugins || []
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  const compiler = webpack(webpackConfig)
  compiler.run(async function (err, stats) {
    if (err) return console.log(err)
    if (options.static && isDir(path.join(options.dir, options.static))) {
      await fs.copy(path.join(options.dir, options.static), path.join(options.dir, options.dist, options.static))
    }
    console.log(
      stats.toString({
        colors: true
      })
    )
  })
}

function isDir(path) {
  try {
    return fs.lstatSync(path).isDirectory(path)
  } catch (err) {
    return false
  }
}
