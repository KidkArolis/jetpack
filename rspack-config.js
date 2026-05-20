import createRspackConfig from './lib/rspack.config.js'
import { resolveOptions } from './lib/options.js'

export default async function createJetpackRspackConfig(input = {}) {
  const resolved = input.mode !== undefined && input.logLevels
  const options = resolved ? input : await resolveOptions(input)
  return createRspackConfig(options)
}
