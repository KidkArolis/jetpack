import { createRequire } from 'node:module'
import { SwcJsMinimizerRspackPlugin } from '@rspack/core'
import { targetQuery } from './browsers.js'

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
  const normalized = filepath.replaceAll('\\', '/')
  for (const pkg of JETPACK_BUNDLED_DEPS) {
    if (normalized.includes(`node_modules/${pkg}/`)) return false
  }
  return true
}

function packageNameFromNodeModules(filepath) {
  const normalized = filepath.replaceAll('\\', '/')
  const index = normalized.lastIndexOf('/node_modules/')
  if (index === -1) return null

  const parts = normalized.slice(index + '/node_modules/'.length).split('/')
  if (parts[0]?.startsWith('@')) {
    return parts[1] ? `${parts[0]}/${parts[1]}` : null
  }
  return parts[0] || null
}

function packageListIncludes(packages, filepath) {
  const pkg = packageNameFromNodeModules(filepath)
  return pkg ? packages.includes(pkg) : false
}

function shouldTranspileDependency(filepath, options) {
  if (!isJetpackBundledDep(filepath)) return false

  const pkg = packageNameFromNodeModules(filepath)
  if (!pkg) return false

  const setting = options.transpileDependencies ?? true
  if (setting === false) return false
  if (setting === true) return true
  if (Array.isArray(setting)) return setting.includes(pkg)

  const include = setting.include === true || (Array.isArray(setting.include) && setting.include.includes(pkg))
  return include && !packageListIncludes(setting.exclude, filepath)
}

function envOptions(options) {
  const targets = targetQuery(options)
  const polyfills = options.polyfills ?? 'usage'
  return {
    targets,
    ...(polyfills && {
      coreJs: coreJsVersion,
      mode: polyfills
    })
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
  // and any user-configured exclusions.
  config.module.rules[0].oneOf.push({
    test: /\.(js|mjs)$/,
    include: (filepath) => shouldTranspileDependency(filepath, options),
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
