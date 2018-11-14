const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const handlebars = require('handlebars')
const chalk = require('chalk')
const wpConf = require('./webpack.config')
const { recomputeAssets } = require('./options')

module.exports = async function build (options, log) {
  log.info('Building for production...')

  process.env.NODE_ENV = 'production'
  const webpackConfig = await wpConf(options)
  const compiler = webpack(webpackConfig)

  const target = path.join(options.dir, options.dist)
  await fs.remove(target)
  log.info('Deleted existing', chalk.gray(options.dist), 'directory')

  if (!options.quiet) {
    require('./reporter')(compiler, log, { printAssets: true, dir: options.dir })
  }

  compiler.run(async function (err, stats) {
    if (err) return console.log(err)

    // we've compiled assets, we therefore need to recompute options.assets
    options = recomputeAssets(options)

    if (options.static && isDir(path.join(options.dir, options.static))) {
      await fs.copy(path.join(options.dir, options.static), path.join(options.dir, options.dist, 'assets'))
    }

    const head = options.head && handlebars.compile(options.head)(options)
    const body = options.body && handlebars.compile(options.body)(options)
    const html = options.html && handlebars.compile(options.html)(Object.assign({}, options, { head, body }))
    html && await fs.writeFile(path.join(target, 'index.html'), html)

    if (stats.hasErrors()) {
      process.exit(1)
    }
  })
}

function isDir (path) {
  try {
    return fs.lstatSync(path).isDirectory(path)
  } catch (err) {
    return false
  }
}
