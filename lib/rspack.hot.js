import { createRequire } from 'node:module'
import rspack from '@rspack/core'
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'
import { isUsingReact } from './react.js'

const require = createRequire(import.meta.url)

export default (config, options) => {
  if (options.mode !== 'production' && options.hot.enabled) {
    config.plugins.push(new rspack.HotModuleReplacementPlugin())

    // Must match where dev.js mounts webpack-hot-middleware
    const hmrPath = options.assetBasePathname + '__webpack_hmr'

    Object.keys(config.entry).forEach((e) => {
      const quietParam = options.hot.quiet ? '&quiet=true' : ''
      config.entry[e] = [
        require.resolve('./hmrFirefoxFix'),
        require.resolve('webpack-hot-middleware/client') + `?path=${hmrPath}&reload=false${quietParam}`
      ].concat(config.entry[e])
    })

    if (isUsingReact(options.dir)) {
      config.plugins.push(new ReactRefreshRspackPlugin())
      config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
    }
  }
}
