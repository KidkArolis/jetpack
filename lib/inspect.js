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
  // webpack-bundle-analyzer (v5) calls `stats.toJson()` with no args in
  // server mode, and Rspack 2's default returns a near-empty payload (no
  // modules/chunks/assets). Patch the Stats's toJson before the analyzer
  // sees it so it gets a full payload.
  rspackConfig.plugins.push(forceFullStats())
  rspackConfig.plugins.push(
    new BundleAnalyzerPlugin({
      // Only auto-open the browser when running interactively
      openAnalyzer: !!process.stdout.isTTY
    })
  )
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

function forceFullStats() {
  // Rspack 2 enables a bunch of grouping flags under `all: true` that turn
  // the `assets`/`modules`/`chunks` arrays into group summaries (entries
  // like { name: '*.js', type: 'assets by path' }). webpack-bundle-analyzer
  // expects flat per-file entries — turn the grouping off.
  const opts = {
    all: true,
    groupAssetsByPath: false,
    groupAssetsByExtension: false,
    groupAssetsByEmitStatus: false,
    groupAssetsByInfo: false,
    groupAssetsByChunk: false,
    groupModulesByPath: false,
    groupModulesByExtension: false,
    groupModulesByCacheStatus: false,
    groupModulesByLayer: false,
    groupModulesByAttributes: false,
    groupModulesByType: false,
    groupChunksByPath: false,
    groupChunksByExtension: false
  }
  return {
    apply(compiler) {
      compiler.hooks.done.tap({ name: 'JetpackForceFullStats', stage: -1000 }, (stats) => {
        const original = stats.toJson.bind(stats)
        stats.toJson = (callerOpts) => original(callerOpts ?? opts)
      })
    }
  }
}
