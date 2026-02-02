const rspack = require('@rspack/core')
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh')

module.exports = (config, options) => {
  if (!options.production && options.hot.enabled) {
    config.plugins.push(new rspack.HotModuleReplacementPlugin())

    Object.keys(config.entry).forEach((e) => {
      const quietParam = options.hot.quiet ? '&quiet=true' : ''
      config.entry[e] = [
        require.resolve('./hmrFirefoxFix'),
        require.resolve('webpack-hot-middleware/client') + `?path=/assets/__webpack_hmr&reload=false${quietParam}`
      ].concat(config.entry[e])
    })

    if (options.react) {
      config.plugins.push(new ReactRefreshPlugin())
      config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
    }
  }
}
