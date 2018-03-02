/**
 * handle node req/res
 * and respond with client side app in both dev and prod!
 * handle all that jazz so you don't have to
 */

const cli = require('../cli')
const proxy = require('./proxy')
const send = require('./send')
const render = require('./render')

let options

module.exports = function handle (req, res) {
  if (!options) {
    options = cli.options()
  }

  if (req.path.startsWith('/client/')) {
    proxy(req, res, `http://localhost:${options.port + 1}`)
  } else {
    send(req, res, render(options))
  }
}
