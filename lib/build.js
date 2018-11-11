const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const ejs = require('ejs')
const wpConf = require('./webpack.config')
const { recomputeAssets } = require('./options')

module.exports = async function build (options, log) {
  log.info('Building for production...')

  process.env.NODE_ENV = 'production'
  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)

  const target = path.join(process.cwd(), options.dist)
  await fs.remove(target)

  compiler.run(async function (err, stats) {
    if (err) return console.log(err)

    // we've compiled assets, we therefore need to recompute options.assets
    options = recomputeAssets(options)

    if (options.static && isDir(path.join(options.dir, options.static))) {
      await fs.copy(path.join(options.dir, options.static), path.join(options.dir, options.dist, options.static))
    }

    const html = ejs.render(options.html, options)
    await fs.writeFile(path.join(target, 'index.html'), html)

    console.log(stats.toString({
      colors: true
    }))

    if (options.hooks && options.hooks.afterBuild) {
      await options.hooks.afterBuild(options, stats)
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
