/**
 * handle node req/res
 * and respond with client side app in both dev and prd!
 * in dev – proxy to the jetpack dev server
 * in prd – serve the static assets from dist
 * handle all that jazz so you don't have to
 */

const fs = require('fs-extra')
const path = require('path')
const send = require('send')
const http = require('http')
const parseUrl = require('parseurl')
const browsers = require('./browsers')
const getOptions = require('./options')

const options = getOptions()

const env = process.env.NODE_ENV || 'development'

const modernBrowserRegexp = browsers.regexp({ modern: true })

module.exports =
  env === 'development'
    ? createProxy(`http://localhost:${options.port}`)
    : createServe(path.join(options.dir, options.dist))

function createProxy (target) {
  return function proxy (req, res) {
    return new Promise((resolve, reject) => {
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
        proxyRes.pipe(res)
        res.statusCode = proxyRes.statusCode
        Object.keys(proxyRes.headers).forEach(header => res.setHeader(header, proxyRes.headers[header]))
      })

      proxyReq.on('error', function (err) {
        if (err.code === 'ECONNREFUSED') {
          const msg = `
    Failed to connect to the jetpack dev server.
    Make sure it's running by executing: jetpack
          `
          console.log(msg)
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: msg }))
        }
        reject(err)
        // TODO - reemit error?
      })
      proxyReq.on('end', function () {
        resolve()
      })

      req.pipe(proxyReq)
    })
  }
}

function createServe (root) {
  const modernBundleExists = fs.pathExistsSync(path.join(root, 'index.html'))
  const legacyBundleExists = fs.pathExistsSync(path.join(root, 'index.legacy.html'))

  function getIndex (userAgent) {
    if (!legacyBundleExists && !modernBundleExists) {
      return null
    }

    if (!legacyBundleExists) {
      return '/index.html'
    }

    if (!modernBundleExists) {
      return '/index.legacy.html'
    }

    if (userAgent && modernBrowserRegexp.test(userAgent)) {
      return '/index.html'
    }

    return '/index.legacy.html'
  }

  return async function serve (req, res, next) {
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
      pathname = getIndex(req.headers['user-agent'])
    }

    if (pathname) {
      const stream = send(req, pathname, { root })
      stream.on('directory', () => next())
      stream.on('error', err => next(err))
      stream.pipe(res)
    } else {
      res.send('No bundle found')
    }
  }
}
