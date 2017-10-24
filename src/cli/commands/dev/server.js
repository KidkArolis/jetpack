const fs = require('fs')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const requireRelative = require('require-relative')
const chalk = require('chalk')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const nodemon = require('nodemon')
const wpConf = require('../../../webpack.config')
const render = require('./render')

module.exports = async function devServer (options) {
  // if (options.start) {
  //   return client({ pkg, options })
  // }

  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)

  // if (options.build) {
  //   build({ pkg, options, webpackConfig, compiler })
  // } else {

    console.log(chalk.yellow(`[jetpack] ${options.pkg.version} 🚀`))
    console.log(chalk.yellow(`[jetpack] Serving client from ${requireRelative.resolve(options.client, process.cwd())}`))
    console.log(chalk.yellow(`[jetpack] Running server from ${requireRelative.resolve(options.server, process.cwd())}`))

    await client({ pkg: options.pkg, options, webpackConfig, compiler })
    const s = await server({ pkg: options.pkg, options })

    console.log(chalk.green(`[jetpack] App started on http://localhost:${options.port}`))
    console.log(chalk.yellow('[jetpack] Webpack starting'))
  // }
}

function build ({ compiler }) {
  // if we're building, switch to prod env
  process.env.NODE_ENV = 'production'
  compiler.run(function (err, stats) {
    if (err) return console.log(err)
    console.log(stats.toString())
  })
}

async function client ({ pkg, options, webpackConfig, compiler }) {
  const app = express()

  let html
  if (options.html) {
    html = fs.readFileSync(path.join(process.cwd(), options.html))
  }

  // no runtime webpack in start mode
  if (options.start) {
    app.use('/dist', express.static(path.join(process.cwd(), 'dist')))
  } else {
    const reporter = require('./reporter')
    // const log = (...args) => { console.log('LOGING'); console.log(chalk.green(['[webpack]', ...args].join(' '))) }
    // const warn = (...args) => console.log(chalk.yellow(['[webpack]', ...args].join(' ')))
    // const error = (...args) => console.log(chalk.red(['[webpack]', ...args].join(' ')))
    app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer, { reporter })))
    app.use(webpackHotMiddleware(compiler, { log: false }))
  }

  app.use(express.static(path.join(process.cwd(), options.public)))

  app.get('*', function (req, res) {
    res.send(html || render({ name: options.pkg.name }))
  })

  return new Promise (function (resolve) {
    let server = app.listen(options.port + 1, () => {
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
    console.log('App has started')
  }).on('crash', function () {
    console.log('App has crashed')
  }).on('quit', function () {
    console.log('App has quit')
    process.exit()
  }).on('restart', function (files) {
    console.log('App restarted due to: ', files)
  })
}
