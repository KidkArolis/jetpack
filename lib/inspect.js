import fs from 'node:fs/promises'
import path from 'node:path'
import rspack from '@rspack/core'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import createRspackConfig from './rspack.config.js'

export default async function inspect(options, log) {
  log.info('Generating report...')
  process.env.NODE_ENV = 'production'
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = !options.target.modern ? rspackConfigs.legacy : rspackConfigs.modern
  rspackConfig.plugins = rspackConfig.plugins || []
  // Only auto-open the browser when running interactively
  rspackConfig.plugins.push(new BundleAnalyzerPlugin({ openAnalyzer: !!process.stdout.isTTY }))
  const compiler = rspack(rspackConfig)
  compiler.run(async function (err, stats) {
    if (err) return console.log(err)
    if (options.static && (await isDir(path.join(options.dir, options.static)))) {
      await fs.cp(path.join(options.dir, options.static), path.join(options.dir, options.dist, options.static), {
        recursive: true
      })
    }
    console.log(
      stats.toString({
        colors: true
      })
    )
  })
}

async function isDir(path) {
  try {
    const stats = await fs.stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}
