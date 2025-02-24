const rspack = require('@rspack/core')
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh')

module.exports = (config, options) => {
  if (!options.production && options.hot) {
    config.plugins.push(new rspack.HotModuleReplacementPlugin())

    Object.keys(config.entry).forEach((e) => {
      config.entry[e] = [
        require.resolve('webpack-hot-middleware/client') + '?path=/assets/__webpack_hmr&reload=false'
      ].concat(config.entry[e])
    })

    if (options.react) {
      config.plugins.push(new ReactRefreshPlugin())
      config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
    }
  }
}
