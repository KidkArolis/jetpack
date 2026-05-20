/**
 * handle node req/res
 * and respond with client side app in both dev and prd!
 * in dev – proxy to the jetpack dev server
 * in prd – serve the static assets from dist
 * handle all that jazz so you don't have to
 */

import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import send from 'send'
import chalk from 'picocolors'
import * as browsers from './browsers.js'
import { renderHtmlResponse } from './html.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function serve(options) {
  if (!options) {
    throw new TypeError('serve requires a resolved Jetpack config object.')
  }

  const dir = path.resolve(options.dir || process.cwd())
  const outDir = options.outDir || 'dist'
  const host = options.host || 'localhost'
  const port = options.port || 3030

  return options.mode === 'production'
    ? createStaticServe(path.join(dir, outDir), { dir })
    : createProxy(`http://${host}:${port}`)
}

function createProxy(target) {
  const errorHtmlPath = path.join(__dirname, 'html', 'error-not-running.html')
  const errorHtmlPromise = fs.readFile(errorHtmlPath, 'utf8').catch(() => null)

  return function proxy(req, res, next) {
    try {
      const parsedTarget = new URL(target)
      const parsedReq = new URL(req.url, 'http://_')
      const reqOpt = {
        host: parsedTarget.hostname,
        port: parsedTarget.port,
        headers: req.headers,
        method: req.method,
        path: parsedReq.pathname + parsedReq.search,
        params: req.params,
        session: req.session
      }
      const sendProxyError = (statusCode, headers, body) => {
        if (res.headersSent || res.writableEnded) {
          return
        }
        res.writeHead(statusCode, headers)
        res.end(body)
      }

      const proxyReq = http.request(reqOpt, function (proxyRes) {
        if (res.headersSent || res.writableEnded) {
          proxyRes.resume()
          return
        }

        const contentType = proxyRes.headers['content-type'] || ''
        if (res.locals?.cspNonce && contentType.includes('text/html')) {
          const chunks = []
          proxyRes.on('data', (chunk) => chunks.push(chunk))
          proxyRes.on('end', () => {
            const headers = Object.assign({}, proxyRes.headers)
            delete headers['content-length']
            const html = Buffer.concat(chunks).toString()
            res.writeHead(proxyRes.statusCode, headers)
            res.end(renderHtmlResponse(html, { cspNonce: res.locals.cspNonce }))
          })
          return
        }

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
              sendProxyError(502, { 'Content-Type': 'text/html' }, html)
            } else {
              sendProxyError(
                502,
                { 'Content-Type': 'text/html' },
                '<!DOCTYPE html><h1>jetpack not running</h1><p>Failed to connect to the jetpack dev server.</p>'
              )
            }
          } else {
            sendProxyError(502, { 'Content-Type': 'application/json' }, JSON.stringify({ error: msg }))
          }
        } else if (err.message === 'Request timeout') {
          console.error(chalk.red('[jetpack] Proxy request timed out'))
          sendProxyError(
            504,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ error: 'Proxy request timed out' })
          )
        } else {
          console.log(err)
          sendProxyError(502, { 'Content-Type': 'application/json' }, JSON.stringify({ error: err.stack }))
        }
      })

      req.pipe(proxyReq)
    } catch (err) {
      next(err)
    }
  }
}

function createStaticServe(root, { dir } = {}) {
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
    let pathname = new URL(req.url, 'http://_').pathname
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
      pathname = getIndex(req.headers['user-agent'], getModernBrowserRegex(dir))
    }

    if (pathname) {
      if ((pathname === '/index.html' || pathname === '/index.legacy.html') && res.locals?.cspNonce) {
        const html = await fs.readFile(path.join(root, pathname), 'utf8')
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.send(renderHtmlResponse(html, { cspNonce: res.locals.cspNonce }))
        return
      }

      const stream = send(req, pathname, { root })
      stream.on('directory', () => next())
      stream.on('error', (err) => next(err))
      stream.pipe(res)
    } else {
      res.send('No bundle found')
    }
  }
}

const modernBrowserRegexes = new Map()
function getModernBrowserRegex(dir) {
  const key = dir || process.cwd()
  if (!modernBrowserRegexes.has(key)) {
    modernBrowserRegexes.set(key, browsers.regex({ bundleTarget: 'modern', dir: key }))
  }
  return modernBrowserRegexes.get(key)
}
