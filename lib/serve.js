/**
 * handle node req/res
 * and respond with client side app in both dev and prd!
 * in dev – proxy to the jetpack dev server
 * in prd – serve the static assets from dist
 * handle all that jazz so you don't have to
 */

const fs = require('fs')
const { access } = require('fs').promises
const path = require('path')
const send = require('send')
const http = require('http')
const parseUrl = require('parseurl')
const url = require('url')
const cli = require('./cli')

const options = cli.options()

const env = process.env.NODE_ENV || 'development'

module.exports =
  env === 'development'
    ? createProxy(`http://localhost:${options.port}`)
    : createServe(path.join(options.dir, options.dist))

function createProxy (target) {
  return function proxy (req, res) {
    return new Promise((resolve, reject) => {
      const parsedTarget = url.parse(target)
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
  return async function serve (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    let pathname = parseUrl(req).pathname
    try {
      await access(path.join(root, pathname), fs.constants.F_OK)
    } catch (err) {
      if (err.code === 'ENOENT') {
        pathname = '/index.html'
      }
    }
    const stream = send(req, pathname, { root })
    stream.on('directory', () => next())
    stream.on('error', err => next(err))
    stream.pipe(res)
  }
}
