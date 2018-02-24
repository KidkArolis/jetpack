const path = require('path')
const express = require('express')
const webpack = require('webpack')
const nodemon = require('nodemon')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const wpConf = require('../../webpack.config')
const pkg = require('../../package.json')
const render = require('../server/render')
const log = require('../log')
const reporter = require('./reporter')

module.exports = async function devServer (options) {
  log.verbose(`${pkg.version} 🚀`)
  log.verbose(`Root   ${options.dir}`)
  if (options.client) {
    log.verbose(`Client ${options.client}`)
  }
  if (options.server) {
    log.verbose(`Server ${options.server}`)
  }

  if (options.client) {
    await client({ pkg: options.pkg, options })
  }
  if (options.server) {
    await server({ pkg: options.pkg, options })
  }

  log.info(`App started http://localhost:${options.port}`)
}

async function client ({ pkg, options }) {
  const app = express()
  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer, { reporter })))
  app.use(webpackHotMiddleware(compiler, { path: '/client/__webpack_hmr', log: false }))

  // there are 3 modes for how the SPA html gets rendered
  // if no server is in use, we'll render it right here
  if (!options.server) {
    if (options.static) {
      app.use('/static', express.static(path.join(process.cwd(), options.static)))
    }
    if (options.middleware) {
      app.use(options.middleware)
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

async function server ({ pkg, options }) {
  require('nodemon/lib/utils').log.required(false)

  const app = nodemon({
    exec: `node ${options.server} ${process.argv.slice(2).join(' ')}`,
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
    log.verbose('Server restarted due to: ', files)
  })
}
