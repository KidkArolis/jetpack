const path = require('path')
const webpackPkg = require('webpack/package.json')
const nodemonPkg = require('nodemon/package.json')
const wpConf = require('../../webpack.config')
const pkg = require('../../package.json')
const render = require('../handle/render')
const reporter = require('./reporter')

module.exports = async function devServer (options, log) {
  log.info(`Jetpack ${pkg.version} 🚀`)
  log.verbose(`Webpack ${webpackPkg.version}`)
  log.verbose(`Nodemon ${nodemonPkg.version}`)
  log.verbose(`Dir ${options.dir}`)
  if (options.client) {
    log.verbose(`Client ${options.client}`)
  }
  if (options.server) {
    log.verbose(`Server ${options.server}`)
  }

  if (options.client && !options.clientDisabled) {
    await client({ pkg: options.pkg, options, log })
  }
  if (options.server && !options.serverDisabled) {
    await server({ pkg: options.pkg, options, log })
  }

  if (!options.server) {
    log.info(`App started http://localhost:${options.port}`)
  } else {
    if (options.client && options.server && options.serverDisabled) {
      log.info(`Serving client on http://localhost:${options.port + 1}`)
    }
  }
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

  // there are 3 modes for how the SPA html gets rendered
  // if no server is in use, we'll render it right here
  if (!options.server) {
    if (options.static) {
      app.use('/static', express.static(path.join(process.cwd(), options.static)))
    }
    app.get('*', function (req, res) {
      res.send(render(options))
    })
  }

  let port = options.port
  if (options.server) {
    port += 1
  }

  return new Promise(function (resolve) {
    let server = app.listen(port, () => {
      return resolve(server.address().port)
    })
  })
}

async function server ({ pkg, options, log }) {
  const nodemon = require('nodemon')

  require('nodemon/lib/utils').log.required(false)

  const app = nodemon({
    exec: `JETPACK_ARGS="${process.argv.slice(2).join(' ')}" node ${options.server}`,
    ext: 'js json yml',
    ignore: options.client,
    quiet: true
  })

  app.on('crash', function () {
    log.error('Server has crashed')
  }).on('quit', function () {
    log.info('Server has quit')
    process.exit()
  }).on('restart', function (files) {
    log.verbose('Server restarted due to', files.join(', '))
  })
}
