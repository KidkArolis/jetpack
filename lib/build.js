const fs = require('fs-extra')
const path = require('path')
const rspack = require('@rspack/core')
const handlebars = require('handlebars')
const chalk = require('picocolors')
const wpConf = require('./webpack.config')
const printConfig = require('./printConfig')
const { recomputeAssets } = require('./options')

module.exports = async function build(options, log) {
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

  const webpackConfig = await wpConf(options, log)
  const modernCompiler = rspack(webpackConfig.modern)
  const legacyCompiler = rspack(webpackConfig.legacy)

  const target = path.join(options.dir, options.dist)
  if (await fs.pathExists(target)) {
    await fs.remove(target)
    log.info('Deleted existing', chalk.gray(options.dist), 'directory')
  }

  if (options.target.modern) {
    log.info('Building modern bundle')
    await run(modernCompiler, { modern: true })
  }
  if (options.target.legacy) {
    log.info('Building legacy bundle')
    await run(legacyCompiler, { modern: false })
  }

  async function run(compiler, { modern }) {
    if (options.logLevels.info) {
      require('./reporter')(compiler, log, {
        printAssets: true,
        dir: options.dir
      })
    }

    try {
      await new Promise((resolve, reject) => {
        compiler.run(async function (err, stats) {
          try {
            if (err) {
              throw err
            }

            if (stats.hasErrors()) {
              throw new Error('Compilation failed')
            }

            // we've compiled assets, we therefore need to recompute options.assets
            options = recomputeAssets(options, stats.toJson({ assets: false, chunks: false, modules: false }))

            if (options.static && isDir(path.join(options.dir, options.static))) {
              await fs.copy(path.join(options.dir, options.static), path.join(options.dir, options.dist, 'assets'))
            }

            const head = options.head && handlebars.compile(options.head)(options)
            const body = options.body && handlebars.compile(options.body)(options)
            const html = options.html && handlebars.compile(options.html)(Object.assign({}, options, { head, body }))
            html && (await fs.writeFile(path.join(target, modern ? 'index.html' : 'index.legacy.html'), html))
            resolve()
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

function isDir(path) {
  try {
    return fs.lstatSync(path).isDirectory(path)
  } catch (err) {
    return false
  }
}
