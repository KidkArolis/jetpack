import { createRequire } from 'node:module'
import rspack from '@rspack/core'
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'

const require = createRequire(import.meta.url)

export default (config, options) => {
  if (!options.production && options.hot.enabled) {
    config.plugins.push(new rspack.HotModuleReplacementPlugin())

    // Must match where dev.js mounts webpack-hot-middleware
    const hmrPath = options.publicPathName + '__webpack_hmr'

    Object.keys(config.entry).forEach((e) => {
      const quietParam = options.hot.quiet ? '&quiet=true' : ''
      config.entry[e] = [
        require.resolve('./hmrFirefoxFix'),
        require.resolve('webpack-hot-middleware/client') + `?path=${hmrPath}&reload=false${quietParam}`
      ].concat(config.entry[e])
    })

    if (options.react) {
      config.plugins.push(new ReactRefreshRspackPlugin())
      config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
    }
  }
}
