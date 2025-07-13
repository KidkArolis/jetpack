const util = require('util')
const createRspackConfig = require('./rspack.config')

module.exports = async function printConfig({ options, modern, log }) {
  log.info(modern ? 'Modern config\n' : 'Legacy config\n')

  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = modern ? rspackConfigs.modern : rspackConfigs.legacy
  console.log(util.inspect(rspackConfig, { depth: null, colors: true }))
}
