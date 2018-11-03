/**
 * handle node req/res
 * and respond with client side app in both dev and prod!
 * handle all that jazz so you don't have to
 */

const path = require('path')
const cli = require('../cli')
const proxy = require('./proxy')
const createServeStatic = require('./serve')

let options = cli.options()

module.exports = options.env === 'development'
  ? promised(createProxy())
  : promised(createServe())

function createProxy () {
  return (req, res) => proxy(req, res, `http://localhost:${options.port}`)
}

function createServe () {
  let serveStatic = createServeStatic(path.join(process.cwd(), options.dist))
  return (req, res, next) => serveStatic(req, res, next)
}

function promised (handler) {
  return async function (req, res, next) {
    try {
      handler(req, res, next)
    } catch (err) {
      if (next) {
        next(err)
      } else {
        throw err
      }
    }
  }
}
