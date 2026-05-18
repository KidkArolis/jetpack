import { options as cliOptions } from './lib/cli.js'
import createJetpackConfig from './lib/rspack.config.js'

export default async () => {
  const options = await cliOptions()
  return createJetpackConfig(options).modern
}
