import createRspackConfig from './lib/rspack.config.js'
import { resolveOptions } from './lib/options.js'

export default async function createJetpackRspackConfig(input = {}, runtime = {}) {
  const options = await resolveOptions(
    runtime.target
      ? {
          ...input,
          overrides: {
            ...input.overrides,
            target: runtime.target
          }
        }
      : input
  )
  return createRspackConfig(options)
}
