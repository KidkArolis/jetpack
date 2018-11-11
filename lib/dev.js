const path = require('path')
const webpackPkg = require('webpack/package.json')
const execa = require('execa')
const chalk = require('chalk')
const prepend = require('prepend-transform').default
const ejs = require('ejs')
const wpConf = require('./webpack.config')
const pkg = require('../package.json')
const reporter = require('./reporter')
const proxy = require('./proxy')

module.exports = async function devServer (options, log) {
  log.info(`Jetpack ${pkg.version} 🚀`)
  log.verbose(`Webpack ${chalk.magenta(webpackPkg.version)}`)
  log.verbose(`Dir ${chalk.magenta(options.dir)}`)
  if (options.client) {
    log.verbose(`Client ${chalk.magenta(options.client)}`)
  }

  if (options.server) {
    log.verbose(`Server ${chalk.magenta(options.server)}`)
  }

  if (options.client) {
    await client({ pkg: options.pkg, options, log })
  }

  if (options.server) {
    await server({ pkg: options.pkg, options, log })
  }

  log.info(`Asset server http://localhost:${options.port}`)
}

async function client ({ pkg, options, log }) {
  const express = require('express')
  const webpack = require('webpack')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware')

  const app = express()
  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer, {
    reporter: reporter(log)
  })))
  app.use(webpackHotMiddleware(compiler, {
    path: '/client/__webpack_hmr',
    log: false
  }))

  if (options.static) {
    app.use('/static', express.static(path.join(process.cwd(), options.static)))
  }

  Object.keys(options.proxy).forEach(endpoint => {
    app.get(endpoint, proxy(options.proxy[endpoint]))
  })

  app.get('*', function (req, res) {
    res.send(ejs.render(options.html, options))
  })

  return new Promise(function (resolve) {
    let server = app.listen(options.port, () => {
      return resolve(server.address().port)
    })
  })
}

async function server ({ options }) {
  const p = execa.shell(options.server)
  const prefix = chalk.blue('jetpack: ')
  p.stdout.pipe(prepend(prefix)).pipe(process.stdout)
  p.stderr.pipe(prepend(prefix)).pipe(process.stderr)
}
