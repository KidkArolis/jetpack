import util from 'node:util'
import createRspackConfig from './rspack.config.js'

export default async function printConfig({ options, modern, log }) {
  log.info(modern ? 'Modern config\n' : 'Legacy config\n')

  const rspackConfigs = createRspackConfig(options, log, { target: modern ? 'modern' : 'legacy' })
  const rspackConfig = modern ? rspackConfigs.modern : rspackConfigs.legacy
  console.log(util.inspect(rspackConfig, { depth: null, colors: true }))
}
