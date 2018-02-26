const url = require('url')
const http = require('http')

module.exports = function proxy (req, res, target) {
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
      .filter(header => header !== 'transfer-encoding')
      .forEach(header => res.set(header, proxyRes.headers[header]))
  })
  req.pipe(proxyReq)
}
