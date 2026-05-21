import { createRequire } from 'node:module'
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh'
import { isUsingReact } from './react.js'

const require = createRequire(import.meta.url)

export default (config, options) => {
  if (options.mode !== 'production' && options.hot.enabled) {
    if (isUsingReact(options.dir)) {
      config.plugins.push(new ReactRefreshRspackPlugin())
      config.resolve.alias['react-refresh/runtime'] = require.resolve('react-refresh/runtime')
    }
  }
}
