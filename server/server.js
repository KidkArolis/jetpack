const fs = require('fs')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const requireRelative = require('require-relative')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const wpConf = require('../webpack.config')

const app = express()
const render = require('./render')

module.exports = function (cliOptions) {
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync('./package.json'))
  } catch (err) {
    pkg = { name: 'jetpack' }
  }

  let jsx = 'React.createElement'
  try {
    requireRelative.resolve('preact', process.cwd())
    jsx = 'Preact.h'
  } catch (err) {}

  const options = Object.assign({
    port: 3000,
    jsx: jsx,
    html: null,
    public: 'public'
  }, pkg.jetpack)

  if (cliOptions.port) options.port = cliOptions.port
  if (cliOptions.jsx) options.jsx = cliOptions.jsx
  if (cliOptions.html) options.html = cliOptions.html
  if (cliOptions.public) options.public = cliOptions.public

  let html
  if (options.html) {
    html = fs.readFileSync(path.join(process.cwd(), html))
  }

  let webpackConfig

  webpackConfig = Object.assign({}, wpConf(options), {
    plugins: (wpConf.plugins || []).concat(new webpack.HotModuleReplacementPlugin())
  })

  Object.keys(webpackConfig.entry).forEach(e => {
    webpackConfig.entry[e] = [webpackConfig.entry[e], require.resolve('webpack-hot-middleware/client')]
  })

  const compiler = webpack(webpackConfig)

  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath
  }))

  app.use(webpackHotMiddleware(compiler))

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
