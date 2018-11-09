const url = require('url')
const http = require('http')

module.exports = (target) => (req, res) => {
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
}
