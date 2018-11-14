const path = require('path')
const chalk = require('chalk')
const webpackPkg = require('webpack/package.json')
const wpConf = require('./webpack.config')
const pkg = require('../package.json')

module.exports = async function devServer (options, log) {
  log.info(`Jetpack ${pkg.version} 🚀`)
  log.verbose(`Webpack ${chalk.magenta(webpackPkg.version)}`)
  log.verbose(`Dir ${chalk.magenta(options.dir)}`)

  if (options.entry) {
    log.verbose(`Entry ${chalk.magenta(options.entry)}`)
  }

  if (options.exec) {
    log.verbose(`Executing ${chalk.magenta(options.exec)}`)
  }

  if (options.entry) {
    await client({ options, log })
  }

  if (options.exec) {
    await server({ options, log })
  }

  log.info(`Asset server http://localhost:${options.port}`)
}

async function client ({ options, log }) {
  const express = require('express')
  const webpack = require('webpack')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware')

  const app = express()
  const webpackConfig = await wpConf(options)
  const compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer)))
  app.use(webpackHotMiddleware(compiler, {
    path: '/assets/__webpack_hmr',
    log: false
  }))

  if (!options.quiet) {
    require('./reporter')(compiler, log, { dir: options.dir })
  }

  if (options.static) {
    app.use('/assets', express.static(path.join(options.dir, options.static)))
  }

  Object.keys(options.proxy).forEach(endpoint => {
    const proxy = require('./proxy')
    app.get(endpoint, proxy(options.proxy[endpoint]))
  })

  app.get('*', function (req, res) {
    const ejs = require('ejs')
    res.send(ejs.render(options.html, options))
  })

  return new Promise(function (resolve) {
    let server = app.listen(options.port, () => {
      return resolve(server.address().port)
    })
  })
}

async function server ({ options }) {
  const execa = require('execa')
  const prepend = require('prepend-transform').default
  const p = execa.shell(options.exec)
  const prefix = chalk.gray('jetpack » ')
  p.stdout.pipe(prepend(prefix)).pipe(process.stdout)
  p.stderr.pipe(prepend(prefix)).pipe(process.stderr)
}
