const fs = require('fs')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const requireRelative = require('require-relative')
const chalk = require('chalk')
const nodemon = require('nodemon')
const log = require('../../log')
const wpConf = require('../../../webpack.config')
const pkg = require('../../../package.json')
const render = require('./render')

module.exports = async function devServer (options) {
  // if (options.start) {
  //   return client({ pkg, options })
  // }

  // if (options.build) {
  //   build({ pkg, options, webpackConfig, compiler })
  //   return
  // }

  log.verbose(`${pkg.version} 🚀`)
  if (options.client) {
    log.verbose(`Client ${requireRelative.resolve(options.client, process.cwd())}`)
  }
  if (options.server) {
    log.verbose(`Server ${requireRelative.resolve(options.server, process.cwd())}`)
  }

  if (options.client) {
    await client({ pkg: options.pkg, options })
  }
  if (options.server) {
    const s = await server({ pkg: options.pkg, options })
  }

  log.info(`App started http://localhost:${options.port}`)
  log.verbose('Webpack starting')
}

function build ({ compiler }) {
  // if we're building, switch to prod env
  process.env.NODE_ENV = 'production'
  compiler.run(function (err, stats) {
    if (err) return console.log(err)
    console.log(stats.toString())
  })
}

async function client ({ pkg, options }) {
  const app = express()
  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)

  let html
  // TODO - allow html to be a js module that's required and expects to return
  // ~promise of the html.
  // Could this go even further with the `pages` concept and route matching..?
  if (options.html) {
    html = fs.readFileSync(path.join(process.cwd(), options.html))
  }

  // no runtime webpack in start mode
  if (options.start) {
    app.use('/dist', express.static(path.join(process.cwd(), 'dist')))
  } else {
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpackHotMiddleware = require('webpack-hot-middleware')
    const reporter = require('./reporter')
    app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer, { reporter })))
    app.use(webpackHotMiddleware(compiler, { log: false }))
  }

  app.use(express.static(path.join(process.cwd(), options.public)))

  app.get('*', function (req, res) {
    res.send(html || render({ name: options.pkg.name }))
  })

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
    exec: `node ${options.server}`,
    ext: 'js json yml',
    ignore: options.client,
    quiet: true
  })

  app.on('start', function () {
    console.log('Server has started')
  }).on('crash', function () {
    console.log('Server has crashed')
  }).on('quit', function () {
    console.log('Server has quit')
    process.exit()
  }).on('restart', function (files) {
    console.log('Server restarted due to: ', files)
  })
}
