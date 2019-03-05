const path = require('path')
const webpack = require('webpack')
const requireRelative = require('require-relative')

module.exports = (config, options) => {
  if (!options.production && options.hot) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/assets/__webpack_hmr&noInfo=true&reload=false'
      ].concat(config.entry[e])
    })

    const usingReactHotLoader = isUsingReactHotLoader(options.dir)
    const usingReact = isUsingReact(options.dir)
    const usingReactDOM = isUsingReactDOM(options.dir)

    if (usingReactHotLoader && usingReact && usingReactDOM) {
      // important for when jetpack is used without installing it locally
      config.resolve.alias['react-hot-loader'] = path.dirname(requireRelative.resolve('react-hot-loader', options.dir))
      config.resolve.alias['react'] = usingReact
      config.resolve.alias['react-dom'] = usingReactDOM
      config.module.rules[0].oneOf.forEach(rule => {
        rule.use.forEach(loader => {
          if (loader.loader === require.resolve('babel-loader')) {
            loader.options.plugins.push(requireRelative.resolve('react-hot-loader/babel', options.dir))
          }
        })
      })
      config.module.rules.push({
        test: /\.(js|mjs|jsx)$/,
        include: /node_modules/,
        use: [requireRelative.resolve('react-hot-loader/webpack', options.dir)]
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

function isUsingReactHotLoader (dir) {
  try {
    return requireRelative.resolve('react-hot-loader', dir)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return false
}
