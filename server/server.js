const fs = require('fs')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const requireRelative = require('require-relative')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const wpConf = require('../webpack.config')
const render = require('./render')

module.exports = function (cliOptions) {
  // get pkg meta
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync('./package.json'))
  } catch (err) {
    pkg = { name: 'jetpack' }
  }

  // detect how to compile jsx
  let jsx = 'h'
  try {
    requireRelative.resolve('preact', process.cwd())
    jsx = 'Preact.h'
  } catch (err) {}
  try {
    requireRelative.resolve('react', process.cwd())
    jsx = 'React.createElement'
  } catch (err) {}

  // combine defaults/pkg/cli options
  const options = Object.assign({
    port: 3000,
    jsx: jsx,
    html: null,
    public: 'public'
  }, pkg.jetpack, cliOptions)

  if (options.start) {
    return serve({ pkg, options })
  }

  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)

  if (options.build) {
    build({ pkg, options, webpackConfig, compiler })
  } else {
    serve({ pkg, options, webpackConfig, compiler })
  }
}

function build ({ compiler }) {
  // if we're building, switch to prod env
  process.env.NODE_ENV = 'production'
  compiler.run(function (err, stats) {
    if (err) return console.log(err)
    console.log(stats.toString())
  })
}

function serve ({ pkg, options, webpackConfig, compiler }) {
  const app = express()

  let html
  if (options.html) {
    html = fs.readFileSync(path.join(process.cwd(), html))
  }

  // no runtime webpack in start mode
  if (options.start) {
    app.use('/dist', express.static(path.join(process.cwd(), 'dist')))
  } else {
    app.use(webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath
    }))

    app.use(webpackHotMiddleware(compiler))
  }

  app.use(express.static(path.join(process.cwd(), options.public)))

  app.get('*', function (req, res) {
    res.end(html || render({ name: pkg.name }))
  })

  app.listen(options.port, () => {
    console.log('##################################################')
    console.log('#                                                #')
    console.log('#  App started on http://localhost:' + options.port + '          #')
    console.log('#                                                #')
    console.log('##################################################')
  })
}
