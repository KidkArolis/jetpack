const path = require('path')
const express = require('express')
const requireRelative = require('require-relative')
const execa = require('execa')
const log = require('../log')
const pkg = require('../../package.json')
const render = require('../server/render')

module.exports = async function devServer (options) {
  log.verbose(`${pkg.version} 🚀`)
  if (options.client) {
    log.verbose(`Client ${requireRelative.resolve(options.client, process.cwd())}`)
  }
  if (options.server) {
    log.verbose(`Server ${requireRelative.resolve(options.server, process.cwd())}`)
  }

  if (options.client) {
    await client({ pkg: options.pkg, options })
  }
  if (options.server) {
    await server({ pkg: options.pkg, options })
  }

  log.info(`App started http://localhost:${options.port}`)
}

async function client ({ pkg, options }) {
  const app = express()
  app.use('/client', express.static(path.join(process.cwd(), options.dist, 'client')))
  app.use('/static', express.static(path.join(process.cwd(), options.dist, options.static)))
  // there are 3 modes for how the SPA html gets rendered
  // if no server is in use, we'll render it right here
  if (!options.server) {
    app.use('/static', express.static(path.join(process.cwd(), options.static)))
    app.get('*', function (req, res) {
      res.send(render(options))
    })
  }

  let port = options.port
  if (options.server) {
    port += 1
  }

  return new Promise(function (resolve) {
    let server = app.listen(port, () => {
      return resolve(server.address().port)
    })
  })
}

async function server ({ pkg, options }) {
  execa.shell(`node ${options.server}`)
}
