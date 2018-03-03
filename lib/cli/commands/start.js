const path = require('path')
const pkg = require('../../../package.json')
const render = require('../../handle/render')

module.exports = async function start (options, log) {
  log.info(`${pkg.version} 🚀`)
  log.verbose(`Dir ${options.dir}`)
  if (options.client) {
    log.verbose(`Client ${options.client}`)
  }
  if (options.server) {
    log.verbose(`Server ${options.server}`)
  }

  if (options.client && !options.clientDisabled) {
    await client({ pkg: options.pkg, options, log })
  }
  if (options.server && !options.serverDisabled) {
    await server({ pkg: options.pkg, options, log })
  }

  if (!options.server) {
    log.info(`App started http://localhost:${options.port}`)
  }
}

async function client ({ pkg, options }) {
  if (options.server) {
    return // nothing to do if we're using a server component
  }

  const express = require('express')
  // otherwise, this is our server that will serve up the built app
  const app = express()

  app.use('/client', express.static(path.join(process.cwd(), options.dist, 'client')))
  app.use('/static', express.static(path.join(process.cwd(), options.dist, options.static)))
  app.get('*', function (req, res) {
    res.send(render(options))
  })

  return new Promise(function (resolve) {
    let server = app.listen(options.port, () => {
      return resolve(server.address().port)
    })
  })
}

async function server ({ pkg, options }) {
  const execa = require('execa')
  return execa.shell(`JETPACK_ARGS="${process.argv.slice(2).join(' ')}" node ${options.server}`, { stdio: 'inherit' })
}
