/**
 * handle node req/res
 * and respond with client side app in both dev and prd!
 * in dev – proxy to the jetpack dev server
 * in prd – serve the static assets from dist
 * handle all that jazz so you don't have to
 */

const { existsSync } = require('fs')
const fs = require('fs/promises')
const path = require('path')
const send = require('send')
const http = require('http')
const chalk = require('picocolors')
const parseUrl = require('parseurl')
const browsers = require('./browsers')
const getOptions = require('./options')

const options = getOptions()

const env = process.env.NODE_ENV || 'development'

module.exports =
  env === 'development'
    ? createProxy(`http://localhost:${options.port}`)
    : createServe(path.join(options.dir, options.dist))

function createProxy(target) {
  const errorHtmlPath = path.join(__dirname, 'html', 'error-not-running.html')
  const errorHtmlPromise = fs.readFile(errorHtmlPath, 'utf8').catch(() => null)

  return function proxy(req, res, next) {
    try {
      const parsedTarget = new URL(target)
      const parsedReq = parseUrl(req)
      const reqOpt = {
        host: parsedTarget.hostname,
        port: parsedTarget.port,
        headers: req.headers,
        method: req.method,
        path: parsedReq.path,
        params: req.params,
        session: req.session
      }
      const proxyReq = http.request(reqOpt, function (proxyRes) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        proxyRes.pipe(res)
      })

      proxyReq.setTimeout(30000, function () {
        proxyReq.destroy(new Error('Request timeout'))
      })

      proxyReq.on('error', async function (err) {
        if (err.code === 'ECONNREFUSED') {
          const msg = `[jetpack] Failed to connect to the jetpack dev server. Start it by running \`jetpack\` in your project.`
          console.error(chalk.red(msg))

          const acceptHeader = req.headers['accept'] || ''
          if (acceptHeader.includes('text/html')) {
            const html = await errorHtmlPromise
            if (html) {
              res.writeHead(502, { 'Content-Type': 'text/html' })
              res.end(html)
            } else {
              res.writeHead(502, { 'Content-Type': 'text/html' })
              res.end('<!DOCTYPE html><h1>jetpack not running</h1><p>Failed to connect to the jetpack dev server.</p>')
            }
          } else {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: msg }))
          }
        } else if (err.message === 'Request timeout') {
          console.error(chalk.red('[jetpack] Proxy request timed out'))
          res.writeHead(504, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Proxy request timed out' }))
        } else {
          console.log(err)
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.stack }))
        }
      })

      req.pipe(proxyReq)
    } catch (err) {
      next(err)
    }
  }
}

function createServe(root) {
  const modernBundleExists = existsSync(path.join(root, 'index.html'))
  const legacyBundleExists = existsSync(path.join(root, 'index.legacy.html'))

  function getIndex(userAgent, modernBrowserRegex) {
    if (!legacyBundleExists && !modernBundleExists) {
      return null
    }

    if (!legacyBundleExists) {
      return '/index.html'
    }

    if (!modernBundleExists) {
      return '/index.legacy.html'
    }

    if (userAgent && modernBrowserRegex.test(userAgent)) {
      return '/index.html'
    }

    return '/index.legacy.html'
  }

  return async function serve(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    let pathname = parseUrl(req).pathname
    let index = false

    try {
      const stats = await fs.stat(path.join(root, pathname))
      index = !stats.isFile()
    } catch (err) {
      if (err.code === 'ENOENT') {
        index = true
      }
    }

    if (index) {
      pathname = getIndex(req.headers['user-agent'], await getModernBrowserRegex())
    }

    if (pathname) {
      const stream = send(req, pathname, { root })
      stream.on('directory', () => next())
      stream.on('error', (err) => next(err))
      stream.pipe(res)
    } else {
      res.send('No bundle found')
    }
  }
}

let modernBrowserRegex
async function getModernBrowserRegex() {
  if (!modernBrowserRegex) {
    modernBrowserRegex = browsers.regex({ modern: true }).then((re) => {
      modernBrowserRegex = re
    })
  }
  return modernBrowserRegex
}
