import { createRequire } from 'node:module'
import express from 'express'
import rspack from '@rspack/core'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import createRspackConfig from './rspack.config.js'
import printConfig from './printConfig.js'
import reporter from './reporter.js'
import proxyFactory from './proxy.js'
import { renderHtml } from './html.js'

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

  log.info(`Asset server http://localhost:${options.port}`)
}

async function client({ options, log, modern }) {
  const app = express()
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = modern ? rspackConfigs.modern : rspackConfigs.legacy
  const compiler = rspack(rspackConfig)
  // The bundle's runtime public path is 'auto' (read from script.src), but the
  // middlewares need a static URL prefix to mount at — use the pathname
  // portion of options.assetBaseUrl (handles full URLs like a CDN gracefully).
  app.use(webpackDevMiddleware(compiler, { publicPath: options.assetBasePathname, stats: 'none' }))
  app.use(
    webpackHotMiddleware(compiler, {
      path: options.assetBasePathname + '__webpack_hmr',
      log: false
    })
  )

  if (options.logLevels.info) {
    reporter(compiler, log, { dir: options.dir })
  }

  if (typeof options.proxy === 'function') {
    options.proxy(app)
  } else {
    Object.keys(options.proxy).forEach((endpoint) => {
      app.all(endpoint, proxyFactory(options.proxy[endpoint], log))
    })
  }

  app.get('/{*splat}', function (_req, res) {
    res.send(renderHtml(options))
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
