const rspack = require('@rspack/core')
const requireRelative = require('require-relative')
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh')

module.exports = (config, options) => {
  if (!options.production && options.hot) {
    config.plugins.push(new rspack.HotModuleReplacementPlugin())

    Object.keys(config.entry).forEach((e) => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/assets/__webpack_hmr&reload=false'
      ].concat(config.entry[e])
    })

    const usingReact = isUsingReact(options.dir)
    const usingReactDOM = isUsingReactDOM(options.dir)

    if (usingReact && usingReactDOM) {
      // important for when jetpack is used without installing it locally
      config.resolve.alias.react = usingReact
      config.resolve.alias['react-dom'] = usingReactDOM

      config.plugins.push(new ReactRefreshPlugin())
      config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
      config.module.rules[0].oneOf.forEach((rule) => {
        if (rule.use) {
          rule.use.forEach((loader) => {
            if (loader.loader === require.resolve('swc-loader')) {
              loader.options.jsc.transform.react = {
                runtime: 'automatic',
                development: true,
                refresh: true
              }
            }
          })
        }
      })
    }
  }
}

function isUsingReact(dir) {
  try {
    return requireRelative.resolve('react', dir).replace(/\/index.js$/, '')
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return false
}

function isUsingReactDOM(dir) {
  try {
    return requireRelative.resolve('react-dom', dir).replace(/\/index.js$/, '')
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
  return false
}
