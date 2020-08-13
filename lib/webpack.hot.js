const path = require('path')
const webpack = require('webpack')
const requireRelative = require('require-relative')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

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

    if (usingReact && usingReactDOM) {
      // important for when jetpack is used without installing it locally
      config.resolve.alias.react = usingReact
      config.resolve.alias['react-dom'] = usingReactDOM

      if (usingReactHotLoader) {
        config.resolve.alias['react-hot-loader'] = path.dirname(requireRelative.resolve('react-hot-loader', options.dir))
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
      } else {
        config.plugins.push(new ReactRefreshWebpackPlugin())
        config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
        config.module.rules[0].oneOf.forEach(rule => {
          rule.use.forEach(loader => {
            if (loader.loader === require.resolve('babel-loader')) {
              loader.options.plugins.push(require.resolve('react-refresh/babel'))
            }
          })
        })
      }
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
