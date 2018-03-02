const parseUrl = require('parseurl')
const path = require('path')
const send = require('send')

module.exports = function serveStatic (root) {
  const opts = { root: path.resolve(root) }

  return function serveStatic (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next()
    }

    const path = parseUrl(req).pathname

    // create send stream
    const stream = send(req, path, opts)

    // add directory handler
    stream.on('directory', function onDirectory () {
      next()
    })

    // forward errors
    stream.on('error', function error () {
      next()
    })

    // pipe
    stream.pipe(res)
  }
}
