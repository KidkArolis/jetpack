import fs from 'node:fs/promises'
import path from 'node:path'
import rspack from '@rspack/core'
import chalk from 'picocolors'
import createRspackConfig from './rspack.config.js'
import printConfig from './printConfig.js'
import reporter from './reporter.js'
import { renderHtml } from './html.js'
import { createBuildManifest, publicManifest } from './manifest.js'

export default async function build(options, log) {
  log.info('Building for production...')

  if (options.printConfig) {
    if (options.target.modern) {
      await printConfig({ options, modern: true, log })
    }
    if (options.target.legacy) {
      await printConfig({ options, modern: false, log })
    }
    return
  }

  const rspackConfigs = createRspackConfig(options, log)
  const modernCompiler = rspack(rspackConfigs.modern)
  const legacyCompiler = rspack(rspackConfigs.legacy)

  log.info('Cleaning', chalk.gray(options.dist), 'directory')
  const target = path.join(options.dir, options.dist)
  const manifests = {}
  await fs.rm(target, { recursive: true, force: true })

  if (options.target.modern) {
    log.info('Building modern bundle')
    manifests.modern = publicManifest(await run(modernCompiler, { modern: true }))
  }
  if (options.target.legacy) {
    log.info('Building legacy bundle')
    manifests.legacy = publicManifest(await run(legacyCompiler, { modern: false }))
  }

  await fs.writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifests, null, 2) + '\n')

  async function run(compiler, { modern }) {
    if (options.logLevels.info) {
      reporter(compiler, log, {
        printAssets: true,
        dir: options.dir
      })
    }

    try {
      return await new Promise((resolve, reject) => {
        compiler.run(async function (err, stats) {
          try {
            if (err) {
              throw err
            }

            if (stats.hasErrors()) {
              throw new Error('Compilation failed')
            }

            const manifest = createBuildManifest(options, stats.toJson({ entrypoints: true }))
            const html = renderHtml(options, manifest)
            await fs.writeFile(path.join(target, modern ? 'index.html' : 'index.legacy.html'), html)
            resolve(manifest)
          } catch (err) {
            reject(err)
          }
        })
      })
    } catch (err) {
      log.error(chalk.red(err.stack))
      process.exit(1)
    }
  }

  // TODO sass-loader with sass-embedded seems to be holding up the process
  // remove once https://github.com/webpack-contrib/sass-loader/issues/1244 is fixed fully
  process.exit(0)
}
