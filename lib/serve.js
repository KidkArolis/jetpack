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
import resolveOptions from './options.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function serve(input = {}) {
  input ||= {}

  if (isResolvedConfig(input)) {
    return serveResolved(input)
  }

  let middlewarePromise = null

  return function jetpackServe(req, res, next) {
    middlewarePromise ||= resolveServeMiddleware(input)
    middlewarePromise.then((middleware) => Promise.resolve(middleware(req, res, next))).catch(next)
  }
}

serve.resolve = async function resolveServe(input = {}) {
  input ||= {}

  if (isResolvedConfig(input)) {
    return serveResolved(input)
  }

  return resolveServeMiddleware(input)
}

export function serveResolved(options) {
  if (!options) {
    throw new TypeError('serveResolved requires a resolved Jetpack config object.')
  }

  const dir = path.resolve(options.dir || process.cwd())
  const outDir = options.build?.outDir || 'dist'
  const host = options.host || 'localhost'
  const port = options.port || 3030

  return options.mode === 'production'
    ? createStaticServe(path.join(dir, outDir), { dir })
    : createProxy(`http://${host}:${port}`)
}

async function resolveServeMiddleware(input) {
  const config = await resolveOptions({
    ...input,
    command: input.command || (process.env.NODE_ENV === 'production' ? 'build' : 'dev'),
    dir: input.dir || process.cwd()
  })

  return serveResolved(config)
}

function isResolvedConfig(input) {
  return Boolean(input && typeof input === 'object' && input.mode && input.build?.outDir)
}

function createProxy(target) {
  const errorHtmlPath = path.join(__dirname, 'html', 'error-not-running.html')
  const errorHtmlPromise = fs.readFile(errorHtmlPath, 'utf8').catch(() => null)

  return function proxy(req, res, next) {
    try {
      const parsedTarget = new URL(target)
      const parsedReq = new URL(req.url, 'http://_')
      const shouldTransformHtml = Boolean(res.locals?.cspNonce && acceptsHtml(req))
      const reqOpt = {
        host: parsedTarget.hostname,
        port: parsedTarget.port,
        headers: shouldTransformHtml ? transformSafeRequestHeaders(req.headers) : req.headers,
        method: req.method,
        path: parsedReq.pathname + parsedReq.search,
        params: req.params,
        session: req.session
      }
      const closeResponse = (err) => {
        if (!res.writableEnded && !res.destroyed) {
          res.destroy(err)
        }
      }
      const sendProxyError = (statusCode, headers, body, err) => {
        if (res.headersSent) {
          closeResponse(err)
          return
        }
        if (res.writableEnded || res.destroyed) {
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
        proxyRes.on('error', function (err) {
          console.log(err)
          sendProxyError(502, { 'Content-Type': 'application/json' }, JSON.stringify({ error: err.stack }), err)
        })

        const contentType = proxyRes.headers['content-type'] || ''
        if (shouldTransformHtml && proxyRes.statusCode === 304) {
          proxyRes.resume()
          sendProxyError(
            502,
            { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
            '<!DOCTYPE html><h1>jetpack could not rewrite cached HTML</h1><p>The dev server returned 304 Not Modified for HTML that needs a per-request CSP nonce.</p>',
            new Error('Cannot rewrite a 304 HTML response with a CSP nonce.')
          )
          return
        }

        if (shouldTransformHtml && contentType.includes('text/html')) {
          const chunks = []
          proxyRes.on('data', (chunk) => chunks.push(chunk))
          proxyRes.on('end', () => {
            if (res.headersSent || res.writableEnded || res.destroyed) {
              return
            }
            const headers = transformSafeResponseHeaders(proxyRes.headers)
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
              sendProxyError(502, { 'Content-Type': 'text/html' }, html, err)
            } else {
              sendProxyError(
                502,
                { 'Content-Type': 'text/html' },
                '<!DOCTYPE html><h1>jetpack not running</h1><p>Failed to connect to the jetpack dev server.</p>',
                err
              )
            }
          } else {
            sendProxyError(502, { 'Content-Type': 'application/json' }, JSON.stringify({ error: msg }), err)
          }
        } else if (err.message === 'Request timeout') {
          console.error(chalk.red('[jetpack] Proxy request timed out'))
          sendProxyError(
            504,
            { 'Content-Type': 'application/json' },
            JSON.stringify({ error: 'Proxy request timed out' }),
            err
          )
        } else {
          console.log(err)
          sendProxyError(502, { 'Content-Type': 'application/json' }, JSON.stringify({ error: err.stack }), err)
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
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, no-store'
        })
        res.end(req.method === 'HEAD' ? undefined : renderHtmlResponse(html, { cspNonce: res.locals.cspNonce }))
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

function acceptsHtml(req) {
  const accept = req.headers.accept || ''
  if (typeof accept !== 'string') return false
  if (accept.includes('text/html')) return true
  if (!accept.includes('*/*')) return false

  const pathname = new URL(req.url, 'http://_').pathname
  return path.extname(pathname) === ''
}

function transformSafeRequestHeaders(headers) {
  const nextHeaders = { ...headers }
  delete nextHeaders['if-none-match']
  delete nextHeaders['if-modified-since']
  delete nextHeaders['if-match']
  delete nextHeaders['if-unmodified-since']
  nextHeaders['accept-encoding'] = 'identity'
  return nextHeaders
}

function transformSafeResponseHeaders(headers) {
  const nextHeaders = { ...headers }
  delete nextHeaders['content-length']
  delete nextHeaders['content-encoding']
  delete nextHeaders.etag
  delete nextHeaders['last-modified']
  nextHeaders['cache-control'] = 'private, no-store'
  return nextHeaders
}

const modernBrowserRegexes = new Map()
function getModernBrowserRegex(dir) {
  const key = dir || process.cwd()
  if (!modernBrowserRegexes.has(key)) {
    modernBrowserRegexes.set(key, browsers.regex({ bundleTarget: 'modern', dir: key }))
  }
  return modernBrowserRegexes.get(key)
}
