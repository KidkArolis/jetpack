/**
 * handle node req/res
 * and respond with client side app in both dev and prd!
 * in dev – proxy to the jetpack dev server
 * in prd – serve the static assets from dist
 * handle all that jazz so you don't have to
 */

const path = require('path')
const send = require('send')
const url = require('url')
const http = require('http')
const parseUrl = require('parseurl')
const cli = require('./cli')

const options = cli.options()

module.exports = options.env === 'development'
  ? createProxy(`http://localhost:${options.port}`)
  : createServe(path.join(process.cwd(), options.dist))

function createProxy (target) {
  return function proxy (req, res) {
    const parsed = url.parse(target)
    const reqOpt = {
      host: parsed.hostname,
      port: parsed.port,
      headers: req.headers,
      method: req.method,
      path: req.path,
      params: req.params,
      session: req.session
    }
    const proxyReq = http.request(reqOpt, function (proxyRes) {
      proxyRes.pipe(res)
      res.status(proxyRes.statusCode)
      Object.keys(proxyRes.headers)
        .forEach(header => res.set(header, proxyRes.headers[header]))
    })

    proxyReq.on('error', function (err) {
      if (err.code === 'ECONNREFUSED') {
        const msg = `
          Failed to connect to the jetpack dev server.
          Make sure it's running by executing: jetpack
        `
        console.log(msg)
        res.status(502)
        res.send({ error: msg })
      }
      // TODO - reemit error?
    })

    req.pipe(proxyReq)
  }
}

function createServe (root) {
  return function serve (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const path = parseUrl(req).pathname
    const stream = send(req, path, { root: path.resolve(root) })
    stream.on('directory', () => next())
    stream.on('error', err => next(err))
    stream.pipe(res)
  }
}
