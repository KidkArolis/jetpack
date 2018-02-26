const fresh = require('fresh')
const generateETag = require('etag')

module.exports = function send (req, res, html) {
  if (res.finished || res.headersSent) return

  const etag = generateETag(html)

  if (fresh(req.headers, { etag })) {
    res.statusCode = 304
    res.end()
    return
  }

  res.statusCode = 200
  res.setHeader('ETag', etag)
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
  }
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(req.method === 'HEAD' ? null : html)
}
