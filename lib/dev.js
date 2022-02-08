const path = require('path')
const chalk = require('picocolors')
const webpackPkg = require('webpack/package.json')
const wpConf = require('./webpack.config')
const printConfig = require('./printConfig')
const pkg = require('../package.json')

module.exports = async function devServer(options, log) {
  // by default jetpack builds modern bundle in dev
  // but if --legacy is used or if modern is turned off
  // via settings, build the legacy bundle instead
  const modern = options.target.modern

  log.info(`Jetpack ${pkg.version} • Webpack ${webpackPkg.version}${modern ? '' : ' (legacy build)'} 🚀`)

  if (options.printConfig) {
    await printConfig({ options, modern, log })
    return
  }

  if (options.entry) {
    await client({ options, log, modern })
  }

  if (options.exec) {
    log.info(`Executing ${chalk.magenta(options.exec)} in a subprocess`)
    await server({ options, log })
  }

  log.info(`Asset server http://localhost:${options.port}`)
}

async function client({ options, log, modern }) {
  const express = require('express')
  const webpack = require('webpack')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware')

  const app = express()
  const webpackConfigs = await wpConf(options, log)
  const webpackConfig = modern ? webpackConfigs.modern : webpackConfigs.legacy
  const compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer)))
  app.use(
    webpackHotMiddleware(compiler, {
      path: '/assets/__webpack_hmr',
      log: false
    })
  )

  if (options.logLevels.info) {
    require('./reporter')(compiler, log, { dir: options.dir })
  }

  if (options.static) {
    app.use('/assets', express.static(path.join(options.dir, options.static)))
  }

  if (typeof options.proxy === 'function') {
    options.proxy(app)
  } else {
    Object.keys(options.proxy).forEach((endpoint) => {
      const proxy = require('./proxy')
      app.all(endpoint, proxy(options.proxy[endpoint], log))
    })
  }

  app.get('*', function (req, res) {
    const handlebars = require('handlebars')
    const head = options.head && handlebars.compile(options.head)(options)
    const body = options.body && handlebars.compile(options.body)(options)
    const html = options.html && handlebars.compile(options.html)(Object.assign({}, options, { head, body }))
    res.send(html)
  })

  return new Promise(function (resolve) {
    const server = app.listen(options.port, () => {
      return resolve(server.address().port)
    })
  })
}

async function server({ options }) {
  const { default: execa } = await import('execa')
  const prepend = require('prepend-transform').default
  const p = execa(options.exec, { shell: true })
  const prefix = chalk.gray('jetpack » ')
  p.stdout.pipe(prepend(prefix)).pipe(process.stdout)
  p.stderr.pipe(prepend(prefix)).pipe(process.stderr)
}
