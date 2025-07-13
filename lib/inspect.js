const fs = require('fs-extra')
const path = require('path')
const rspack = require('@rspack/core')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const createRspackConfig = require('./rspack.config')

module.exports = async function (options, log) {
  log.info('Generating report...')
  process.env.NODE_ENV = 'production'
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = !options.target.modern ? rspackConfigs.legacy : rspackConfigs.modern
  rspackConfig.plugins = rspackConfig.plugins || []
  rspackConfig.plugins.push(new BundleAnalyzerPlugin())
  const compiler = rspack(rspackConfig)
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
