import path from 'node:path'
import { spawn } from 'node:child_process'
import { Transform } from 'node:stream'
import { createRequire } from 'node:module'
import express from 'express'
import rspack from '@rspack/core'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
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
  // Mount the dev + hot middlewares at the URL path implied by publicPath.
  // The bundle's runtime publicPath is 'auto' (read from script.src), but
  // these middlewares need a static prefix. If publicPath is a full URL
  // (e.g. CDN), use only its pathname portion.
  const mountPath = middlewareMountPath(options.publicPath)
  app.use(webpackDevMiddleware(compiler, { publicPath: mountPath, stats: 'none' }))
  app.use(
    webpackHotMiddleware(compiler, {
      path: mountPath + '__webpack_hmr',
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
  const p = spawn(options.exec, { shell: true })
  const prefix = chalk.gray('jetpack » ')
  p.stdout.pipe(prependLines(prefix)).pipe(process.stdout)
  p.stderr.pipe(prependLines(prefix)).pipe(process.stderr)
}

// Derive a URL prefix to mount the dev/hot middlewares at. Accepts either a
// path (`/assets/`) or a full URL (`https://cdn.example.com/bundles/`), and
// always returns a path with a trailing slash.
function middlewareMountPath(publicPath) {
  const pathname = new URL(publicPath, 'http://localhost').pathname
  return pathname.endsWith('/') ? pathname : pathname + '/'
}

function prependLines(prefix) {
  let buffer = ''
  return new Transform({
    transform(chunk, _enc, cb) {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) this.push(prefix + line + '\n')
      cb()
    },
    flush(cb) {
      if (buffer) this.push(prefix + buffer + '\n')
      cb()
    }
  })
}
