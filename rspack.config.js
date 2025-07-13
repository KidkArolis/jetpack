const cli = require('./lib/cli')
const createJetpackConfig = require('./lib/rspack.config')

const options = cli.options()
const rspackConfigs = createJetpackConfig(options)

module.exports = rspackConfigs.modern
