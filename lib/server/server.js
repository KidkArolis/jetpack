/**
 * A lightweight express wrapper.
 * Sometimes, you just want to app.get('/shit/done')
 * This is that.
 * Optional though, pull in any server you want!
 */

const path = require('path')
const express = require('express')
const requireRelative = require('require-relative')
const url = require('url')
const chalk = require('chalk')
const proxy = require('express-http-proxy')
const render = require('../commands/dev/render')
const expressLogger = require('./logger')
const cli = require('../cli')

module.exports = function server () {
  const app = express()

  app.use(expressLogger())

  const options = cli.options()

  app.use('/static', express.static(path.join(process.cwd(), options.public)))
  app.get('/dist/*', proxy(`http://localhost:${options.port + 1}`, {
    parseReqBody: false,
    preserveHostHdr: true,
    reqBodyEncoding: null
  }))

  // make the app stoppable, see the npm express-stop package
  app.stop = function () {}

  const _listen = app.listen
  app.listen = function listen (port, cb) {
    // mount the client side handling logic very last

    // there are 3 modes for how the SPA html gets rendered
    // in jetpack server, we render it after all other routes have been configured
    app.get('*', function (req, res) {
      res.send(render({ name: options.pkg.name, bundle: '/dist/bundle.js' }, options))
    })

    return _listen.call(app, port || options.port, function onListen (...args) {
      cb && cb(...args)
    })
  }

  return app
}
