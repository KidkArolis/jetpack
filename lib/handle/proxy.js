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

  proxyReq.on('error', function (err) {
    if (err.code === 'ECONNREFUSED') {
      const msg = 'Failed to connect to the jetpack dev server. Make sure it\'s running by executing: jetpack'
      console.log(msg)
      res.status(502)
      res.send({ error: msg })
    }
  })

  req.pipe(proxyReq)
}
