/**
 * A lightweight express wrapper.
 * Sometimes, you just want to app.get('/shit/done')
 * This is that.
 * Optional, though, pull in any server you want!
 */

const express = require('express')
const requireRelative = require('require-relative')
const url = require('url')
const chalk = require('chalk')
const proxy = require('express-http-proxy')
const expressLogger = require('./logger')
const cli = require('../cli')

module.exports = function server () {
  const app = express()

  app.use(expressLogger())

  const options = cli.options()

  // make the app stoppable, see the npm package
  app.stop = function () {}

  const _listen = app.listen
  app.listen = function listen (port, cb) {
    // mount the client side handling logic very last
    app.use(proxy(`http://localhost:${options.port + 1}`, {
      parseReqBody: false,
      preserveHostHdr: true,
      reqBodyEncoding: null
    }))

    return _listen.call(app, port || options.port, function onListen (...args) {
      cb && cb(...args)
    })
  }

  return app
}
