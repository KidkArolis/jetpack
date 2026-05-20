import fs from 'node:fs/promises'
import path from 'node:path'
import rspack from '@rspack/core'
import chalk from 'picocolors'
import createRspackConfig from './rspack.config.js'
import printConfig from './printConfig.js'
import reporter from './reporter.js'
import { renderHtml } from './html.js'
import { createBuildManifest, publicManifest } from './manifest.js'
import { targetIncludes } from './options.js'

export default async function build(options, log, runtime = {}) {
  log.info('Building for production...')

  if (runtime.printConfig) {
    if (targetIncludes(options.target, 'modern')) {
      await printConfig({ options, modern: true, log })
    }
    if (targetIncludes(options.target, 'legacy')) {
      await printConfig({ options, modern: false, log })
    }
    return
  }

  const rspackConfigs = createRspackConfig(options, log)
  const modernCompiler = rspack(rspackConfigs.modern)
  const legacyCompiler = rspack(rspackConfigs.legacy)

  log.info('Cleaning', chalk.gray(options.build.outDir), 'directory')
  const target = path.join(options.dir, options.build.outDir)
  const manifests = {}
  await fs.rm(target, { recursive: true, force: true })

  if (targetIncludes(options.target, 'modern')) {
    log.info('Building modern bundle')
    manifests.modern = publicManifest(await run(modernCompiler, { modern: true }))
  }
  if (targetIncludes(options.target, 'legacy')) {
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

    return new Promise((resolve, reject) => {
      compiler.run(async function (err, stats) {
        let result
        let failure

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
          result = manifest
        } catch (err) {
          failure = err
        }

        compiler.close((closeErr) => {
          if (failure) return reject(failure)
          if (closeErr) return reject(closeErr)
          resolve(result)
        })
      })
    })
  }
}
