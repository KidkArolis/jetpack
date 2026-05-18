import path from 'node:path'
import { createRequire } from 'node:module'
import express from 'express'
import rspack from '@rspack/core'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import { execa } from 'execa'
import prepend from 'prepend-transform'
import handlebars from 'handlebars'
import chalk from 'picocolors'
import createRspackConfig from './rspack.config.js'
import printConfig from './printConfig.js'
import reporter from './reporter.js'
import proxyFactory from './proxy.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')
const rspackPkg = require('@rspack/core/package.json')

export default async function devServer(options, log) {
  // by default jetpack builds modern bundle in dev
  // but if --legacy is used or if modern is turned off
  // via settings, build the legacy bundle instead
  const modern = options.target.modern

  log.info(`Jetpack ${pkg.version} • Rspack ${rspackPkg.version}${modern ? '' : ' (legacy build)'} 🚀`)

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
  const app = express()
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = modern ? rspackConfigs.modern : rspackConfigs.legacy
  const compiler = rspack(rspackConfig)
  app.use(webpackDevMiddleware(compiler, Object.assign({}, rspackConfig.devServer)))
  app.use(
    webpackHotMiddleware(compiler, {
      path: '/assets/__webpack_hmr',
      log: false
    })
  )

  if (options.logLevels.info) {
    reporter(compiler, log, { dir: options.dir })
  }

  if (options.static) {
    app.use('/assets', express.static(path.join(options.dir, options.static)))
  }

  if (typeof options.proxy === 'function') {
    options.proxy(app)
  } else {
    Object.keys(options.proxy).forEach((endpoint) => {
      app.all(endpoint, proxyFactory(options.proxy[endpoint], log))
    })
  }

  app.get('/{*splat}', function (_req, res) {
    const head = options.head && handlebars.compile(options.head)(options)
    const body = options.body && handlebars.compile(options.body)(options)
    const html = options.html && handlebars.compile(options.html)(Object.assign({}, options, { head, body }))
    res.send(html)
  })

  return new Promise(function (resolve) {
    const server = app.listen(options.port, (error) => {
      if (error) {
        throw error
      }
      return resolve(server.address().port)
    })
  })
}

async function server({ options }) {
  const p = execa(options.exec, { shell: true })
  const prefix = chalk.gray('jetpack » ')
  p.stdout.pipe(prepend.default(prefix)).pipe(process.stdout)
  p.stderr.pipe(prepend.default(prefix)).pipe(process.stderr)
}
