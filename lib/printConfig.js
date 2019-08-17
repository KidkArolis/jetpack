const util = require('util')
const wpConf = require('./webpack.config')

module.exports = async function printConfig ({ options, modern, log }) {
  log.info(modern ? 'Modern config\n' : 'Legacy config\n')

  const webpackConfigs = await wpConf(options)
  const webpackConfig = modern ? webpackConfigs.modern : webpackConfigs.legacy
  console.log(util.inspect(webpackConfig, { depth: null, colors: true }))
}
