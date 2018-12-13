const path = require('path')
const webpack = require('webpack')
const requireRelative = require('require-relative')

module.exports = (config, options) => {
  if (!options.production && options.hot) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/assets/__webpack_hmr&noInfo=true&reload=true'
      ].concat(config.entry[e])
    })

    const usingReact = isUsingReact(options.dir)
    const usingReactDOM = isUsingReactDOM(options.dir)

    if (usingReact) {
      // important for when jetpack is used without installing it locally
      config.resolve.alias['react-hot-loader'] = path.dirname(require.resolve('react-hot-loader'))
      config.resolve.alias['react'] = usingReact
      config.resolve.alias['react-dom'] = usingReactDOM
      config.module.rules[0].oneOf.forEach(rule => {
        rule.use.forEach(loader => {
          if (loader.loader === require.resolve('babel-loader')) {
            loader.options.plugins.push(require.resolve('react-hot-loader/babel'))
          }
        })
      })
    }
  }
}

function isUsingReact (dir) {
  try {
    return requireRelative.resolve('react', dir)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return false
}

function isUsingReactDOM (dir) {
  try {
    return requireRelative.resolve('react-dom', dir)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return false
}
