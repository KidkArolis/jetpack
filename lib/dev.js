import { createRequire } from 'node:module'
import express from 'express'
import rspack from '@rspack/core'
import { RspackDevServer } from '@rspack/dev-server'
import createRspackConfig from './rspack.config.js'
import printConfig from './printConfig.js'
import reporter from './reporter.js'
import { renderHtml } from './html.js'
import { createDevManifest } from './manifest.js'
import { addJetpackOverlayEntry, addOverlayMiddlewares, createOverlayEvents } from './overlay/server.js'
import { targetIncludes } from './options.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')
const rspackPkg = require('@rspack/core/package.json')

export default async function rspackDevServer(options, log, runtime = {}) {
  const modern = targetIncludes(options.target, 'modern')

  log.info(`Jetpack ${pkg.version} • Rspack ${rspackPkg.version}${modern ? '' : ' (legacy build)'} 🚀`)

  if (runtime.printConfig) {
    await printConfig({ options, modern, log })
    return
  }

  if (options.entry) {
    await client({ options, log, modern })
  }

  log.info(`Asset server http://${options.host}:${options.port}`)
}

async function client({ options, log, modern }) {
  const rspackConfigs = createRspackConfig(options, log)
  const rspackConfig = modern ? rspackConfigs.modern : rspackConfigs.legacy
  if (options.dev.overlay) {
    addJetpackOverlayEntry(rspackConfig)
  }
  const manifest = createDevManifest(options, { modern })
  const compiler = rspack(rspackConfig)
  const overlayEvents = options.dev.overlay ? createOverlayEvents(compiler, options) : null

  if (options.logLevels.info) {
    reporter(compiler, log, { dir: options.dir })
  }

  const server = new RspackDevServer(
    {
      host: options.host,
      port: options.port,
      hot: options.hot.enabled ? 'only' : false,
      liveReload: false,
      allowedHosts: 'all',
      static: false,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      client: {
        overlay: false,
        logging: options.hot.quiet || options.logLevels.none ? 'none' : 'info',
        progress: false
      },
      devMiddleware: {
        publicPath: options.assetBasePathname,
        stats: 'none'
      },
      app: async () => express(),
      setupMiddlewares: (middlewares) => {
        if (options.dev.overlay) {
          addOverlayMiddlewares(middlewares, compiler, options, overlayEvents)
        }
        addHtmlFallback(middlewares, options, manifest)

        return middlewares
      }
    },
    compiler
  )

  await server.start()
}

function addHtmlFallback(middlewares, options, manifest) {
  middlewares.push({
    name: 'jetpack-html-fallback',
    middleware: (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next()
        return
      }

      res.send(renderHtml(options, manifest))
    }
  })
}
