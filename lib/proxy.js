const http = require('http')
const querystring = require('querystring')

module.exports = (target, log) => (req, res) => {
  if (req.params[0] && target.includes('/:splat')) {
    target = target.replace('/:splat', req.params[0])
  }

  const parsed = new URL(target)
  const path = Object.keys(req.query).length > 0 ? req.path + '?' + querystring.stringify(req.query) : req.path
  const reqOpt = {
    host: parsed.hostname,
    port: parsed.port,
    headers: req.headers,
    method: req.method,
    path,
    params: req.params,
    session: req.session
  }
  const sendProxyError = (statusCode, body) => {
    if (res.headersSent || res.writableEnded) {
      return
    }
    res.status(statusCode)
    res.send(body)
  }

  const proxyReq = http.request(reqOpt, function (proxyRes) {
    if (res.headersSent || res.writableEnded) {
      proxyRes.resume()
      return
    }
    res.status(proxyRes.statusCode)
    Object.keys(proxyRes.headers).forEach((header) => res.set(header, proxyRes.headers[header]))
    proxyRes.pipe(res)
  })

  proxyReq.setTimeout(30000, function () {
    proxyReq.destroy(new Error('Request timeout'))
  })

  req.pipe(proxyReq)

  proxyReq.on('error', function (err) {
    if (err.message === 'Request timeout') {
      log.error(`Proxy request to ${target} timed out`)
      sendProxyError(504, { error: 'Request timeout' })
    } else {
      log.error(`Failed to proxy ${req.url} to ${target}:`, err.message)
      sendProxyError(502, { error: err })
    }
  })
}
