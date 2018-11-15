const url = require('url')
const http = require('http')

module.exports = (target, log) => (req, res) => {
  if (req.params[0] && target.includes('/:splat')) {
    target = target.replace('/:splat', req.params[0])
  }

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
  req.pipe(proxyReq)

  proxyReq.on('error', function (err) {
    log.error(`Failed to proxy ${req.url} to ${target}:`, err.message)
    res.status(502)
    res.send({ error: err })
  })
}
