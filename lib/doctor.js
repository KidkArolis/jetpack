import rspack from '@rspack/core'
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin'
import createRspackConfig from './rspack.config.js'

export default async function doctor(options, log) {
  log.info('Running Rsdoctor — opening the report when build finishes...')
  process.env.NODE_ENV = 'production'
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = !options.target.modern ? rspackConfigs.legacy : rspackConfigs.modern
  rspackConfig.plugins = rspackConfig.plugins || []
  rspackConfig.plugins.push(
    new RsdoctorRspackPlugin({
      // Only auto-open the report when running interactively
      disableClientServer: !process.stdout.isTTY
    })
  )
  const compiler = rspack(rspackConfig)
  compiler.run((err, stats) => {
    if (err) return console.log(err)
    console.log(stats.toString({ colors: true }))
  })
}
