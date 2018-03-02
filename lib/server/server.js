/**
 * A lightweight express wrapper.
 * Sometimes, you just want to app.get('/shit/done')
 * This is that.
 * Optional though, pull in any server you want!
 */

const path = require('path')
const express = require('express')
const expressLogger = require('./logger')
const cli = require('../cli')
const handle = require('../handle')

module.exports = function server () {
  const options = cli.options()
  const log = cli.logger()
  const app = express()

  app.use(expressLogger())
  app.use('/static', express.static(path.join(process.cwd(), options.static)))
  app.get('/client/*', handle)

  const _listen = app.listen
  app.listen = function listen (port, cb) {
    // mount the SPA root page very last
    app.get('*', handle)
    return _listen.call(app, port || options.port, function onListen (err) {
      log.info(`App started http://localhost:${options.port}`)
      cb && cb(err)
    })
  }

  return app
}
