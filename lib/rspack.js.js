import { createRequire } from 'node:module'
import { SwcJsMinimizerRspackPlugin } from '@rspack/core'
import { query } from './browsers.js'

const require = createRequire(import.meta.url)
// Tells swc's env preset which polyfills are available in the installed
// core-js. Read major.minor from the package so this stays in sync.
const coreJsVersion = require('core-js/package.json').version.split('.').slice(0, 2).join('.')

export default (config, options) => {
  // src files — `detectSyntax: 'auto'` lets one rule handle .js/.jsx/.ts/.tsx
  // (swc-loader infers parser config from the file extension).
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs|jsx|ts|tsx)$/,
    exclude: /(node_modules)/,
    use: [
      {
        loader: 'builtin:swc-loader',
        options: {
          env: {
            targets: query(options),
            coreJs: coreJsVersion,
            mode: 'usage'
          },
          jsc: {
            externalHelpers: true,
            transform: {}
          },
          detectSyntax: 'auto',
          isModule: 'unknown'
        }
      }
    ]
  })

  // transpile node_modules (JS-only)
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs)$/,
    include(filepath) {
      if (filepath.startsWith(config.resolve.alias['core-js'])) return false
      if (filepath.startsWith(config.resolve.alias['@swc/helpers'])) return false
      if (filepath.includes('node_modules/ansi-html-community/')) return false
      if (filepath.includes('node_modules/ansi-regex/')) return false
      if (filepath.includes('node_modules/core-js/')) return false
      if (filepath.includes('node_modules/css-loader/')) return false
      if (filepath.includes('node_modules/html-entities/')) return false
      if (filepath.includes('node_modules/strip-ansi/')) return false
      if (filepath.includes('node_modules/style-loader/')) return false
      if (filepath.includes('node_modules/webpack-hot-middleware/')) return false

      return true
    },
    use: [
      {
        loader: 'builtin:swc-loader',
        options: {
          env: {
            targets: query(options),
            coreJs: coreJsVersion,
            mode: 'usage'
          },
          jsc: {
            externalHelpers: true,
            transform: {}
          },
          detectSyntax: 'auto',
          isModule: 'unknown'
        }
      }
    ]
  })

  if (options.production) {
    config.optimization.minimizer = options.minify
      ? [
          new SwcJsMinimizerRspackPlugin({
            minimizerOptions: {
              mangle: true,
              compress: true
            }
          })
        ]
      : []
  }
}
