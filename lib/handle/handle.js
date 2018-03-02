/**
 * handle node req/res
 * and respond with client side app in both dev and prod!
 * handle all that jazz so you don't have to
 */

const path = require('path')
const cli = require('../cli')
const proxy = require('./proxy')
const send = require('./send')
const createServe = require('./serve')
const render = require('./render')

let options
let serve

module.exports = function handle (req, res, next = () => {}) {
  if (!options) {
    options = cli.options()
    if (options.env !== 'development' || options.cmd === 'start') {
      serve = createServe(path.join(process.cwd(), options.dist))
    }
  }

  if (req.path.startsWith('/client/')) {
    if (serve) {
      serve(req, res, next)
    } else {
      proxy(req, res, `http://localhost:${options.port + 1}`)
    }
  } else {
    send(req, res, render(options))
  }
}
