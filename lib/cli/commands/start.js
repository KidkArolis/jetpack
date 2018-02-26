const path = require('path')
const express = require('express')
const execa = require('execa')
const pkg = require('../../../package.json')
const render = require('../../handle/render')

module.exports = async function devServer (options, log) {
  log.verbose(`${pkg.version} 🚀`)
  log.verbose(`Dir ${options.dir}`)
  if (options.client) {
    log.verbose(`Client ${options.client}`)
  }
  if (options.server) {
    log.verbose(`Server ${options.server}`)
  }

  if (options.client) {
    await client({ pkg: options.pkg, options, log })
  }
  if (options.server) {
    await server({ pkg: options.pkg, options, log })
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
