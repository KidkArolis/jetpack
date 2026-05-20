import { createRequire } from 'node:module'
import { SwcJsMinimizerRspackPlugin } from '@rspack/core'
import { query } from './browsers.js'

const require = createRequire(import.meta.url)
// Tells swc's env preset which polyfills are available in the installed
// core-js. Read major.minor from the package so this stays in sync.
const coreJsVersion = require('core-js/package.json').version.split('.').slice(0, 2).join('.')

// Packages jetpack pulls into the user's bundle as part of its own runtime
// (HMR client, CSS loaders' inline runtime, ANSI helpers, polyfills, etc.).
// These are already shipped in a browser-compatible form and don't need
// re-transpiling — re-running swc on them is pure overhead.
const JETPACK_BUNDLED_DEPS = [
  '@swc/helpers',
  'ansi-html-community',
  'ansi-regex',
  'core-js',
  'css-loader',
  'html-entities',
  'strip-ansi',
  'style-loader',
  'webpack-hot-middleware'
]

function isJetpackBundledDep(filepath) {
  for (const pkg of JETPACK_BUNDLED_DEPS) {
    if (filepath.includes(`node_modules/${pkg}/`)) return false
  }
  return true
}

function envOptions(options) {
  const targets = query(options)
  return {
    ...(targets && { targets }),
    coreJs: coreJsVersion,
    mode: 'usage'
  }
}

export default (config, options) => {
  // src files — `detectSyntax: 'auto'` lets one rule handle .js/.jsx/.ts/.tsx
  // (swc-loader infers parser config from the file extension). `isModule:
  // 'unknown'` auto-detects ESM vs CJS per file — needed so CJS deps like
  // react aren't mangled into ESM.
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs|jsx|ts|tsx)$/,
    exclude: /(node_modules)/,
    use: [
      {
        loader: 'builtin:swc-loader',
        options: {
          env: envOptions(options),
          jsc: {
            externalHelpers: true
          },
          detectSyntax: 'auto',
          isModule: 'unknown'
        }
      }
    ]
  })

  // transpile node_modules (JS-only), excluding jetpack's own bundled deps
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs)$/,
    include: isJetpackBundledDep,
    use: [
      {
        loader: 'builtin:swc-loader',
        options: {
          env: envOptions(options),
          jsc: {
            externalHelpers: true
          },
          detectSyntax: 'auto',
          isModule: 'unknown'
        }
      }
    ]
  })

  if (options.mode === 'production') {
    config.optimization.minimizer = options.build.minify
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
